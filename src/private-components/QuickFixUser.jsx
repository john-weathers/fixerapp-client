import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRefreshToken from '../hooks/useRefreshToken';
import io from 'socket.io-client';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import UserConfirmation from './UserConfirmation';
import { faSpinnerThird } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN });
const PROFILE_URL = '/users/profile';
const REQUEST_URL = '/users/request/new';
const CURRENT_URL = '/users/request/current';
const CANCEL_URL = '/users/request/cancel';
let socket;

// add callback for emitters...setErrMsg here
// 'NOK' will be the generic error code for that emitter and should result in an appropriate generic message being set

const QuickFixUser = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const refresh = useRefreshToken();
  const { isLoading: profileLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);
  const { data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const geolocationResult = useGeolocation(); 
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [validCustomLocation, setValidCustomLocation] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12,
  });
  const [count, setCount] = useState(0);
  const [firstUpdate, setFirstUpdate] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    socket = io('http://localhost:8000/user', {
      extraHeaders: {
        'Authorization': `Bearer ${auth.accessToken}`,
      }
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('connect_error', async (err) => {
      if (err.message === 'Authentication error') {
        const newAccessToken = await refresh();
        socket.io.opts.extraHeaders = {
          'Authorization': `Bearer ${newAccessToken}`,
        }
        socket.connect(); // should work, but if issues occur might solve them to disconnect before connecting
      } else if (err.message === 'Unauthorized') {
        navigate('/unauthorized', { replace: true, state: { from: location } });
      } else {
        console.log(err.message); // need to see cases that might come up...may or may not make sense to setErrMsg in this case
      }
    });

    socket.on('job update', (jobDetails) => {
      if (firstUpdate) {
        // force a fetch if it's the first update from the watcher function to grab all the job details
        queryClient.invalidateQueries({ queryKey: ['request'], refetchType: 'all' }); // not sure refetchType: 'all' is necessary here...need to find out more in testing
        setFirstUpdate(false);
      } else {
        // subsequent updates can overwrite old cache data
        queryClient.setQueryData(['request'], oldData => {
          return {
            ...oldData,
            ...jobDetails,
          }
        });
      }

    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.removeAllListeners();
    }
  }, []);

  useEffect(() => {
    if (geolocationResult.isSuccess && geolocationResult?.data?.longitude) setViewState(prev => ({
      ...prev,
      longitude: geolocationResult.data.longitude,
      latitude: geolocationResult.data.latitude,
    }));
  }, [geolocationResult.isSuccess]) // should not have a problem here with an unwanted firing of useEffect after initial isSuccess === true, but keep an eye on in testing

  useEffect(() => {
    if (count >= 4) {
      setErrMsg('Request cancelled due to timeout');
      errRef.current.focus();
      handleCancel();
    } else if (count > 0) {
      setErrMsg(['No fixers in your area at this time', 'Continuing to search for a match']);
      errRef.current.focus();
    }
  }, [count])

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
    if (!validCustomLocation.length || !customLocation) {
      setRequesting(false);
      setErrMsg('Missing location data');
      errRef.current.focus();
      return;
    }
    clearInterval(intervalId);
    setIntervalId(null);
    const interval = setInterval(() => {
      setCount(prev => prev + 1); 
    }, 30000);
    setIntervalId(interval);
    socket.emit('new request', { 
      location: validCustomLocation,
      address: customLocation,
     }, (response) => {
      if (response.status === 'Created') {
        setSearching(true);
      } else if (response.status === 'Missing location data') {
        setRequesting(false);
        clearInterval(intervalId);
        setErrMsg(response.status);
        errRef.current.focus();
      } else {
        setRequesting(false);
        clearInterval(intervalId);
        setErrMsg('Request submission failure');
        errRef.current.focus();
      }
     })
  }
  
  const handleCancel = () => {
    setRequesting(false);
    setSearching(false);
    clearInterval(intervalId);
    setIntervalId(null);
    setCount(0);
    setCustomLocation('');
    setValidCustomLocation(null);
    socket.emit('cancel request', (response) => { // I don't think an acknowledgement without data will cause an issue, but keep an eye on
      if (response.status !== 'No content') setErrMsg('Error deleting request');
    })
  }

  // using jobDetails rather than something like isSuccess because a failed fetch, even after we have data set, seems to cause isSuccess to revert to false
  if (jobDetails) return <UserConfirmation socket={socket} />

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
      {!requesting ? ( 
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
          <form autoComplete='off' onSubmit={handleSubmit}>
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
      ) : requesting && !searching ? (
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
          <FontAwesomeIcon icon={faSpinnerThird} spin />
          <h2>Submitting request...</h2>
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
          <FontAwesomeIcon icon={faSpinnerThird} spin />
          <h2>Searching for fixer near you...</h2>
          <button type='button' onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </>
  )
}
export default QuickFixUser;