import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useGeolocation } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import { faSpinnerThird } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN })
const PROFILE_URL = '/users/profile';
const REQUEST_URL = '/users/request/new';
const SEARCH_URL = '/users/request/search';
const CANCEL_URL = '/users/request/cancel'

const QuickFixUser = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);
  // thinking that adding a query here for already matched requests is best
  // in the event that a request is already in progress we can navigate to that from the beginning (could add option to cancel existing request at same time)
  const geolocationResult = useGeolocation();
  const [currentLocation, setCurrentLocation] = useState(geolocationResult?.data?.longitude 
    ? [geolocationResult?.data?.longitude, geolocationResult?.data?.latitude] : null);
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [validCustomLocation, setValidCustomLocation] = useState(null);
  const [toggleLocation, setToggleLocation] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [count, setCount] = useState(0);
  const [viewState, setViewState] = useState({
    longitude: geolocationResult?.data?.longitude || -122.4194,
    latitude: geolocationResult?.data?.latitude || 37.7749,
    zoom: 12.5,
  });
  const navigate = useNavigate();
  

  const handleCurrentClick = async () => {
    setToggleLocation(false);
    await queryClient.refetchQueries({ queryKey: ['location', 'current'] });
    setCurrentLocation(geolocationResult?.data?.longitude 
      ? [geolocationResult?.data?.longitude, geolocationResult?.data?.latitude] : null);
    if (currentLocation === null) {
      setErrMsg(['Problem getting current location', 'Try again or use custom location'])
      errRef.current.focus();
    }
  }

  const handleCustomClick = () => {
    setCurrentLocation(null);
    setToggleLocation(true);
  }

  const handleChange = (e) => {
    setCustomLocation(e.target.value);
    if (customLocation.length > 5) {
      mapboxClient.geocoding.forwardGeocode({
        query: customLocation,
      })
        .send()
        .then(response => {
          const result = response.body;
          setValidCustomLocation(result.features[0]?.geometry?.coordinates);
          setQueryResponse(result.features);
        });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRequesting(true);
    // api call for creating request document
    const coordinates = currentLocation || validCustomLocation;
    if (!coordinates.length) {
      setErrMsg('Invalid submission');
      return;
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    try {
      const requestResponse = await axiosPrivate.post(REQUEST_URL, {
        location: coordinates,
      });
      console.log(requestResponse?.data) // remove before production
      setSearching(true);
      const interval = setInterval(async () => {
        try {
          const searchResponse = await axiosPrivate.get(SEARCH_URL);
          navigate('/confirmation');
        } catch (err) {
          setCount(prev => prev + 1);
          if (count > 15) {
            setErrMsg(['No fixers in your area at this time', 'Continuing to search for a match']);
          }
        }
      }, 4000);
      setIntervalId(interval);

    } catch (err) {
      if (!err?.response) {
        setErrMsg('No server response');
      } else if (err.response?.status === 400) {
        setErrMsg('No location data') 
      } else {
        setErrMsg('Request failed')
      }
      setRequesting(false);
      errRef.current.focus();
    }
    // setInterval to follow up on status until fulfilled or user cancels
    // counter for number of interval requests that are not fulfilled? this way we can alert the user that there may not be any
    // fixers in the area at this time, giving them additional info to decide if they want to cancel the request or not
    
  }
  
  const handleCancel = async () => {
    setRequesting(false);
    setSearching(false);
    setCount(0);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCustomLocation('');
    setCurrentLocation(null);
    setValidCustomLocation(null);
    try {
      const response = await axiosPrivate.post(CANCEL_URL, {
        empty: 'body',
      });
    } catch (err) {
      console.log(err) // remove before production
    }
  }

  return (
    <>
      <Map
        {...viewState}
        minZoom='11.5'
        maxZoom='19.5'
        onMove={e => setViewState(e.viewState)}
        style={{width: '100vw', height: '100vh'}}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {(currentLocation && requesting) && <Marker longitude={currentLocation[0]} latitude={currentLocation[1]} anchor='bottom' />}
        {(validCustomLocation && requesting) && <Marker longitude={validCustomLocation[0]} latitude={validCustomLocation[1]} anchor='bottom' />}
      </Map>
      {!requesting ? ( 
        <div className='sidebar'>
          {isLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
          <h2>Where do you need help?</h2>
          <div className={errMsg ? 'errmsg' : 'offscreen'}>
            <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
            {Array.isArray(errMsg) ? (
              <p ref={errRef} aria-live='assertive'>{errMsg[0]}
              <br />{errMsg[1]}</p>
            ) : (
              <p ref={errRef} aria-live='assertive'>{errMsg}</p>
            )}
          </div>          
          <form autocomplete='off' onSubmit={handleSubmit}>
            <label htmlFor='choosecurrent'>Current location</label>
            <input id='choosecurrent' type='radio' name='location' onClick={handleCurrentClick} checked={currentLocation ? true : false}/>
            <label htmlFor='choosecustom'>Custom location</label>
            <input id='choosecustom' type='radio' name='location' onClick={handleCustomClick} />
            <div id='querycontainer' className={toggleLocation ? 'show' : 'hide'}> { /* using className here might be unnecessary/redundant or should only be used on this div? */ }
              <input 
                id='customlocation' 
                type='text'
                value={customLocation} 
                placeholder='Address' 
                onChange={handleChange} 
              />
              {queryResponse.length && (
                <ul>
                {queryResponse.map((feature) => <li key={feature.id} onClick={() => {
                  setCustomLocation(feature.place_name);
                  setValidCustomLocation(feature.geometry.coordinates);
                  setQueryResponse([]);
                }}>{feature.place_name}</li>)}
                </ul>
              )}
            </div>
            <button type='submit' disabled={currentLocation.length || validCustomLocation.length ? false : true} >Find Work</button>
          </form>
        </div>
      ) : requesting && !searching
          ? (
          <div className='sidebar'>
            <div className={errMsg ? 'errmsg' : 'offscreen'}>
              <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
              {Array.isArray(errMsg) ? (
                <p ref={errRef} aria-live='assertive'>{errMsg[0]}
                <br />{errMsg[1]}</p>
              ) : (
                <p ref={errRef} aria-live='assertive'>{errMsg}</p>
              )}
            </div>     
            <FontAwesomeIcon icon={faSpinnerThird} />
            <h2>Submitting your request for help...</h2>
            <button type='button' onClick={handleCancel}>Cancel</button>
          </div>
          ) : (
            <div className='sidebar'>
              <div className={errMsg ? 'errmsg' : 'offscreen'}>
                <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
                {Array.isArray(errMsg) ? (
                  <p ref={errRef} aria-live='assertive'>{errMsg[0]}
                  <br />{errMsg[1]}</p>
                ) : (
                  <p ref={errRef} aria-live='assertive'>{errMsg}</p>
                )}
              </div>     
              <FontAwesomeIcon icon={faSpinnerThird} />
              <h2>Searching for Fixer...</h2>
              <button type='button' onClick={handleCancel}>Cancel</button>
            </div>
      )}
    </>
  )
}
export default QuickFixUser;