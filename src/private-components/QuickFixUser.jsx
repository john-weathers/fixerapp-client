import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import { faSpinnerThird } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN });
const PROFILE_URL = '/users/profile';
const REQUEST_URL = '/users/request/new';
const CURRENT_URL = '/users/request/current';
const CANCEL_URL = '/users/request/cancel';

// NOTE: better system would probably be requiring an address here rather than using coordinates/current location
// can still make use of useGeolocation or something similar, reverse geocoding then offering a placeholder address
// simplest solution would be to just remove geolocation and require address
// on the other hand, if this were expanded into all types of repairs (e.g., including car repairs and anything else),
// might be best to categorize and then use system suited for that situation
// ultimately, and most practically, more information should be gathered ahead of time and matching
// would include criteria for appropriate expertise

const QuickFixUser = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading: profileLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);
  const { isSuccess } = useRequest(axiosPrivate, CURRENT_URL);
  const geolocationResult = useGeolocation(); 
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [validCustomLocation, setValidCustomLocation] = useState(null);
  const [searching, setSearching] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (geolocationResult.isSuccess && geolocationResult?.data?.longitude) setViewState(prev => ({
      ...prev,
      longitude: geolocationResult.data.longitude,
      latitude: geolocationResult.data.latitude,
    }));
  }, [geolocationResult.isSuccess]) // should not have a problem here with an unwanted firing of useEffect after initial isSuccess === true, but keep an eye on in testing

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
    setSearching(true);
    if (!validCustomLocation.length) {
      setSearching(false);
      setErrMsg('Invalid submission');
      errRef.current.focus();
      return;
    }
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    const interval = setInterval(() => {
      setErrMsg(['No fixers in your area at this time', 'Continuing to search for a match']);
      errRef.current.focus();
    }, 30000);
    setIntervalId(interval);
    try {
      const matchResponse = await axiosPrivate.post(REQUEST_URL, {
        location: validCustomLocation,
        address: customLocation,
      });
      queryClient.setQueryData(['request'], matchResponse?.data);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      console.log(matchResponse?.data) // remove before production
      navigate('/confirmation');
    } catch (err) {
      setSearching(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      if (!err?.response) {
        setErrMsg('No server response');
      } else if (err.response?.status === 400) {
        setErrMsg('Missing location data'); 
      } else if (err.response?.status === 408) {
        setErrMsg('Request timed out');
      } else {
        setErrMsg('Request failed');
      }
      errRef.current.focus();
    }
  }
  
  const handleCancel = async () => {
    setSearching(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setCustomLocation('');
    setValidCustomLocation(null);
    try {
      await axiosPrivate.delete(CANCEL_URL);
    } catch (err) {
      if (!err?.response) {
        setErrMsg('No server response');
      } else {
        setErrMsg('Request cancellation failed');
      }
      errRef.current.focus();
    }
  }

  if (isSuccess) navigate('/confirmation');

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
        {(validCustomLocation && searching) && <Marker longitude={validCustomLocation[0]} latitude={validCustomLocation[1]} anchor='bottom' />}
      </Map>
      {!searching ? ( 
        <div className='sidebar'>
          {profileLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
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
            <input 
              id='address' 
              type='text'
              value={customLocation} 
              placeholder='Enter property address' 
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
            <button type='submit' disabled={validCustomLocation.length ? false : true} >Find Fixer</button>
          </form>
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