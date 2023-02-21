import { useEffect, useState, useCallback, useRef } from 'react';
import { useProfile, useGeolocation } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import { faSpinnerThird } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN })
const PROFILE_URL = '/users/profile';

const QuickFixUser = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL); // implement some profile data
  const geolocationResult = useGeolocation();
  const [currentLocation, setCurrentLocation] = useState(geolocationResult?.data?.longitude 
    ? [geolocationResult?.data?.longitude, geolocationResult?.data?.latitude] : null);
  const errRef = useRef();
  const [customLocation, setCustomLocation] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [validCustomLocation, setValidCustomLocation] = useState(null);
  const [toggleLocation, setToggleLocation] = useState(false);
  const [searching, setSearching] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: geolocationResult?.data?.longitude || -122.4194,
    latitude: geolocationResult?.data?.latitude || 37.7749,
    zoom: 12.5,
  });
  

  const handleCurrentClick = async () => {
    setToggleLocation(false);
    await queryClient.refetchQueries({ queryKey: ['location', 'current'] });
    setCurrentLocation(geolocationResult?.data?.longitude 
      ? [geolocationResult?.data?.longitude, geolocationResult?.data?.latitude] : null);
    if (currentLocation === null) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearching(true);
    // api call, set on interval?
  }
  
  const handleCancel = () => {
    setSearching(false);
    // abort signal?
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
      {(currentLocation && searching) && <Marker longitude={currentLocation[0]} latitude={currentLocation[1]} anchor='bottom' />}
      {(validCustomLocation && searching) && <Marker longitude={validCustomLocation[0]} latitude={validCustomLocation[1]} anchor='bottom' />}
    </Map>
    {!searching &&
      <div className='sidebar'>
        {isLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
        <h2>Choose your work area</h2>
        <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live='assertive'>Problem getting current location<br />Try again or use custom location</p>
        <form autocomplete='off' onSubmit={handleSubmit}>
          <label htmlFor='choosecurrent'>Current location</label>
          <input id='choosecurrent' type='radio' name='location' onClick={handleCurrentClick} checked={currentLocation ? true : false}/>
          <label htmlFor='choosecustom'>Custom location</label>
          <input id='choosecustom' type='radio' name='location' onClick={handleCustomClick} />
          <div id='querycontainer'>
            <input 
              id='customlocation' 
              type='text' 
              className={toggleLocation ? 'show' : 'hide'} 
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
    }
    {searching &&
      <div className='sidebar'>
        <FontAwesomeIcon icon={faSpinnerThird} />
        <h2>Searching for work near you...</h2>
        <button type='button' onClick={handleCancel}>Cancel</button>
      </div>
    }
    </>
  )
}
export default QuickFixUser;