import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useRefreshToken from '../hooks/useRefreshToken';
import io from 'socket.io-client';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import UserConfirmation from './UserConfirmation';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const geocodingService = mbxGeocoding({ accessToken: MAPBOX_TOKEN });
const PROFILE_URL = '/users/profile';
const CURRENT_URL = '/users/request/current';
let retryAttempts = 2;
let retry = false;
let socket;
let firstUpdate = true;

const QuickFixUser = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
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
  const [viewState, setViewState] = useState(() => {
    const data = queryClient.getQueryData({ queryKey: ['location', 'current'] });
    if (data) {
      return {
        longitude: data.longitude,
        latitude: data.latitude,
        zoom: 12,
      }
    } else {
      return {
        longitude: -122.4194,
        latitude: 37.7749,
        zoom: 12,
      }
    }
  });
  const [count, setCount] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [fixerName, setFixerName] = useState('');
  const [jobId, setJobId] = useState('');
  const [fixerCancelled, setFixerCancelled] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const { active, setActive, mapHeight, mobile, tablet, portrait } = useOutletContext();
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
        socket.connect();
      } else if (err.message === 'Unauthorized') {
        navigate('/unauthorized', { replace: true, state: { from: location } });
      } else {
        setErrMsg(err.message);
      }
    });

    socket.on('job update', (updatedDetails) => {
      if (firstUpdate) {
        setActive(true);
        setRequesting(false);
        setSearching(false);
        clearInterval(intervalId);
        // force a fetch if it's the first update from the watcher function to grab all the job details
        queryClient.invalidateQueries({ queryKey: ['request'], refetchType: 'all' });
        firstUpdate = false;
      } else {
        if (updatedDetails.currentStatus === 'cancelled') {
          setActive(false);
          setFixerCancelled(true);
          queryClient.removeQueries(['request']);
          return;
        }
        if (updatedDetails.currentStatus === 'fulfilled') {
          setFinalizing(true);
          setActive(false);
          socket.emit('leave room', { jobId: jobId });
          firstUpdate = true;
        }
        // subsequent updates can overwrite old cache data
        queryClient.setQueryData(['request'], oldData => {
          return {
            ...oldData,
            ...updatedDetails,
          }
        });
      }

    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    }
  }, []);

  useEffect(() => {
    if (geolocationResult.isSuccess && geolocationResult?.data?.longitude && geolocationResult?.data?.longitude !== viewState.longitude) {
      setViewState(prev => ({
        ...prev,
        longitude: geolocationResult.data.longitude,
        latitude: geolocationResult.data.latitude,
      }));
    }
  }, [geolocationResult.isSuccess]);

  useEffect(() => {
    clearInterval(intervalId);
    setIntervalId(null);
    setCount(0);
    setFixerName(jobDetails?.fixerName);
    setJobId(jobDetails?.jobId);
    if (jobDetails?.jobId && !roomJoined) {
      while (retryAttempts) {
        socket.emit('current job', { 
          jobId: jobDetails.jobId
         }, async (response) => {
          if (response?.status === 'OK') {
            setRoomJoined(true);
            retry = false;
          } else {
            retryAttempts -= 1;
            retry = true;
          }
         });
        if (retry) {
          continue;
        } else {
          break;
        }
      }
      retry = false;
      retryAttempts = 2;
    }
  }, [jobDetails?.jobId]);

  useEffect(() => {
    if (count >= 4) {
      setErrMsg('Request cancelled due to timeout');
      errRef.current.focus();
      handleCancel();
    } else if (count > 0) {
      setErrMsg(['No fixers in your area at this time', 'Continuing to search for a match']);
      errRef.current.focus();
    }
  }, [count]);

  const handleChange = (e) => {
    setCustomLocation(e.target.value);
    if (customLocation.length > 5) {
      geocodingService.forwardGeocode({
        query: customLocation,
      })
        .send()
        .then(response => {
          const result = response.body;
          setValidCustomLocation(result.features[0]?.geometry?.coordinates);
          setQueryResponse(result.features);
        });
    } else {
      setQueryResponse([]);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRequesting(true);
    if (!validCustomLocation?.length || !customLocation) {
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
      if (response?.status === 'Created') {
        setSearching(true);
        setRoomJoined(true);
      } else if (response?.status === 'Missing location data') {
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
    socket.emit('cancel request', (response) => {
      if (response.status !== 'No content') setErrMsg('Error deleting request');
    })
  }

  if (jobDetails?.jobId || finalizing || fixerCancelled) return <UserConfirmation 
    socket={socket} 
    finalizing={finalizing} 
    cancellation={fixerCancelled}
    jobDetails={jobDetails}
    fixerName={fixerName}
    jobId={jobId}
  />

  return (
    <>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
        )}
      </div>  
      <Map
        {...viewState}
        minZoom='11.5'
        maxZoom='19.5'
        onMove={e => setViewState(e.viewState)}
        style={{ width: '100vw', height: mapHeight, minHeight: 500, minWidth: 320 }}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
        padding={
          !portrait && !mobile 
            ? { left: window.innerWidth * 0.27 > 425 ? 425 + 23 : window.innerWidth * 0.27 > 276 ? (window.innerWidth * 0.27) + 23 : 276 + 23, top: 0 }
            : portrait && !mobile
              ? { left: 0, top: 250 + 23 }
              : { left: 0, top: 220 + 23 }
        }
      >
        {(validCustomLocation && searching) && <Marker longitude={validCustomLocation[0]} latitude={validCustomLocation[1]} />}
      </Map>
      {!requesting ? ( 
        <div 
          className='sidebar quick-fix' 
          onClick={() => setQueryResponse([])}
        >
          <div className='flex-container'>
            {profileLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
            <h2>Where do you need help?</h2>        
            <form autoComplete='off' onSubmit={handleSubmit}>
              <input 
                id='address' 
                type='text'
                value={customLocation} 
                placeholder='Property address' 
                onChange={handleChange}
                className={queryResponse?.length ? 'text-field dropdown' : 'text-field'}
              />
              {queryResponse && (
                <ul>
                {queryResponse.map((feature) => <li key={feature.id} onClick={() => {
                  setCustomLocation(feature.place_name);
                  setValidCustomLocation(feature.geometry.coordinates);
                  setViewState(prev => {
                    return {
                      ...prev,
                      longitude: feature.geometry.coordinates[0],
                      latitude: feature.geometry.coordinates[1],
                    }
                  });
                  setQueryResponse([]);
                }}>{feature.place_name}</li>)}
                </ul>
              )}
              <button type='submit' disabled={validCustomLocation?.length ? false : true} className='btn'>Find Fixer</button>
            </form>
          </div>
        </div>
      ) : requesting && !searching ? (
        <div className='sidebar quick-fix'>
          <div className='flex-container requesting'>
            <h2 className='secondary'>Submitting request...</h2>     
            <FontAwesomeIcon icon={faSpinner} spin size='2xl'/>
            <button type='button' onClick={handleCancel} className='btn'>Cancel</button>
          </div>
        </div>
      ) : (
        <div className='sidebar quick-fix'>
          <div className='flex-container requesting'>
            <h2 className='secondary'>Searching for fixer near you...</h2>     
            <FontAwesomeIcon icon={faSpinner} spin size='2xl'/>
            <button type='button' onClick={handleCancel} className='btn'>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
export default QuickFixUser;