import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile, useRequest, useGeolocation, geolocationQuery } from '../hooks/reactQueryHooks';
import useAuth from '../hooks/useAuth';
import useRefreshToken from '../hooks/useRefreshToken';
import io from 'socket.io-client';
import Map, { Marker } from 'react-map-gl';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';
import FixerConfirmation from './FixerConfirmation';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const geocodingService = mbxGeocoding({ accessToken: MAPBOX_TOKEN });
const PROFILE_URL = '/fixers/profile';
const FIND_WORK_URL = '/fixers/work/find';
const CURRENT_URL = '/fixers/work/current';
let retryAttempts = 2;
let retry = false;
let socket;

const QuickFix = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const geolocationResult = useGeolocation(); 
  const { auth } = useAuth();
  const refresh = useRefreshToken();
  const { isLoading: profileLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);
  const { data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const [currentLocation, setCurrentLocation] = useState(() => {
    const data = queryClient.getQueryData({ queryKey: ['location', 'current'] });
    if (data) {
      return [data.longitude, data.latitude];
    } else {
      return null;
    }
  });
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [validCustomLocation, setValidCustomLocation] = useState(null);
  const [toggleLocation, setToggleLocation] = useState(false);
  const [searching, setSearching] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [count, setCount] = useState(0);
  const [viewState, setViewState] = useState(() => {
    if (currentLocation?.length) {
      return {
        longitude: currentLocation[0],
        latitude: currentLocation[1],
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
  const [finalizing, setFinalizing] = useState(false);
  const [userCancelled, setUserCancelled] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    socket = io('http://localhost:8000/fixer', {
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
      if (jobDetails.currentStatus === 'cancelled') {
        setUserCancelled(true);
        queryClient.removeQueries({ queryKey: ['request'], exact: true });
        return;
      }
      queryClient.setQueryData(['request'], oldData => {
        return {
          ...oldData,
          ...jobDetails,
        }
      })
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
    console.log('effect hook firing');
    if (geolocationResult.isSuccess && geolocationResult?.data?.longitude && geolocationResult?.data?.longitude !== viewState.longitude) {
      setViewState(prev => ({
        ...prev,
        longitude: geolocationResult.data.longitude,
        latitude: geolocationResult.data.latitude,
      }));
    }
  }, [geolocationResult.isSuccess]);

  useEffect(() => {
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

  const handleCurrentClick = async () => {
    setToggleLocation(false);
    try {
      const data = await queryClient.fetchQuery(geolocationQuery);
      console.log(data);
      if (data) {
        setCurrentLocation([data.longitude, data.latitude]);
        setViewState(prev => ({
          ...prev,
          longitude: data.longitude,
          latitude: data.latitude,
        }));
      } else {
        setErrMsg('Could not get location data');
      }
    } catch (err) {
      console.log(err);
    }
  }

  const handleCustomClick = () => {
    setCurrentLocation(null);
    setToggleLocation(true);
  }

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
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSearching(true);
    const coordinates = currentLocation || validCustomLocation;
    if (!coordinates?.length) {
      setErrMsg('Missing location data');
      setSearching(false);
      return;
    }
    clearInterval(intervalId);
    setIntervalId(null);
    try {
      const searchResponse = await axiosPrivate.post(FIND_WORK_URL, {
        location: coordinates,
      });
      setRoomJoined(true);
      queryClient.setQueryData(['request'], searchResponse.data);
      while (retryAttempts) {
        socket.emit('work found', async (response) => {
          if (response?.status === 'NOK') {
            retryAttempts -= 1;
            if (!retryAttempts) setRoomJoined(false);
            retry = true;
          } else {
            retry = false;
          }
        });
        if (retry) {
          continue;
        } else {
          retryAttempts = 2;
          retry = false;
          return;
        }
      }
    } catch (err) {
      if (err?.response?.status === 400) {
        setErrMsg('Missing location data');
        setSearching(false);
        return;
      }
      setCount(prev => prev + 1);
    }
    const interval = setInterval(async () => {
      try {
        const searchResponse = await axiosPrivate.post(FIND_WORK_URL, {
          location: coordinates,
        });
        setRoomJoined(true);
        queryClient.setQueryData(['request'], searchResponse.data);
        while (retryAttempts) {
          socket.emit('work found', async (response) => {
            if (response?.status === 'NOK') {
              retryAttempts -= 1;
              if (!retryAttempts) setRoomJoined(false);
              retry = true;
            } else {
              retry = false;
            }
          });
          if (retry) {
            continue;
          } else {
            break;
          }
        }
        clearInterval(intervalId);
        setIntervalId(null);
        retryAttempts = 2;
        retry = false;
      } catch (err) {
        setCount(prev => prev + 1);
        if (count > 15) {
          setErrMsg(['No jobs in your area at this time', 'Continuing to search for a match']);
        }
      }
    }, 4000);
    setIntervalId(interval);
  }
  
  const handleCancel = () => {
    setSearching(false);
    setCount(0);
    clearInterval(intervalId);
    setIntervalId(null);
    retryAttempts = 2;
    retry = false;
    setCustomLocation('');
    setCurrentLocation(null);
    setValidCustomLocation(null);
  }

  // using jobDetails rather than something like isSuccess because a failed fetch, even after we have data set, seems to cause isSuccess to revert to false
  if (jobDetails || finalizing || userCancelled) return <FixerConfirmation socket={socket} finalizing={{ finalizing, setFinalizing }} cancellation={userCancelled} />;

  return (
    <>
      <Map
        {...viewState}
        minZoom='11.5'
        maxZoom='19.5'
        onMove={e => setViewState(e.viewState)}
        style={{width: '100vw', height: '80vh'}}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {(currentLocation && searching) && <Marker longitude={currentLocation[0]} latitude={currentLocation[1]} />}
        {(validCustomLocation && searching) && <Marker longitude={validCustomLocation[0]} latitude={validCustomLocation[1]} />}
      </Map>
      {!searching ? ( 
        <div className='sidebar'>
          {profileLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
          <h2>Choose your work area</h2>
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
            <input id='choosecurrent' type='radio' name='location' onClick={handleCurrentClick} defaultChecked={currentLocation?.length ? true : false}/>
            <label htmlFor='choosecurrent'>Current location</label>
            <input id='choosecustom' type='radio' name='location' onClick={handleCustomClick} />
            <label htmlFor='choosecustom'>Custom location</label>
            <div id='querycontainer' className={toggleLocation ? 'show' : 'hide'}>
              <input 
                id='customlocation' 
                type='text'
                value={customLocation} 
                placeholder='Address' 
                onChange={handleChange} 
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
            </div>
            <button type='submit' disabled={currentLocation?.length || validCustomLocation?.length ? false : true} >Find Work</button>
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
          <FontAwesomeIcon icon={faSpinner} />
          <h2>Searching for work near you...</h2>
          <button type='button' onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </>
  )
}
export default QuickFix;