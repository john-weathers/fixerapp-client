import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import useAuth from '../hooks/useAuth';
import useRefreshToken from '../hooks/useRefreshToken';
import Map, { Marker } from 'react-map-gl';
import { faSpinnerThird } from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';
import FixerConfirmation from './FixerConfirmation';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN });
const PROFILE_URL = '/fixers/profile';
const FIND_WORK_URL = '/fixers/work/find';
const CURRENT_URL = '/fixers/work/current';
let socket;

const QuickFix = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const refresh = useRefreshToken();
  const { isLoading: profileLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);
  const { data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const geolocationResult = useGeolocation();
  const [currentLocation, setCurrentLocation] = useState(geolocationResult?.data?.longitude 
    ? [geolocationResult?.data?.longitude, geolocationResult?.data?.latitude] : null);
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [queryResponse, setQueryResponse] = useState([]);
  const [validCustomLocation, setValidCustomLocation] = useState(null);
  const [toggleLocation, setToggleLocation] = useState(false);
  const [searching, setSearching] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [count, setCount] = useState(0);
  const [viewState, setViewState] = useState({
    longitude: geolocationResult?.data?.longitude || -122.4194,
    latitude: geolocationResult?.data?.latitude || 37.7749,
    zoom: 12,
  });
  const [retryAttempts, setRetryAttempts] = useState(2);
  const [retry, setRetry] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
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
    }
  }, []);

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
    setSearching(true);
    const coordinates = currentLocation || validCustomLocation;
    if (!coordinates.length) {
      setErrMsg('Missing location data');
      return;
    }
    clearInterval(intervalId);
    setIntervalId(null);
    try {
      const searchResponse = await axiosPrivate.post(FIND_WORK_URL, {
        location: coordinates,
      });
      queryClient.setQueryData(['request'], searchResponse.data);
      while (retryAttempts) {
        socket.emit('work found', (response) => {
          if (response.status === 'NOK') {
            setRetryAttempts(prev => prev - 1);
            setRetry(true);
          } else {
            setRetry(false);
          }
        });
        if (retry) {
          continue;
        } else {
          return;
        }
      }
    } catch (err) {
      setCount(prev => prev + 1);
    }
    const interval = setInterval(async () => {
      try {
        const searchResponse = await axiosPrivate.post(FIND_WORK_URL, {
          location: coordinates,
        });
        queryClient.setQueryData(['request'], searchResponse.data);
        while (retryAttempts) {
          socket.emit('work found', (response) => {
            if (response.status === 'NOK') {
              setRetryAttempts(prev => prev - 1);
              setRetry(true);
            } else {
              setRetry(false);
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
      } catch (err) {
        setCount(prev => prev + 1);
        if (count > 15) {
          setErrMsg(['No fixers in your area at this time', 'Continuing to search for a match']);
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
    setCustomLocation('');
    setCurrentLocation(null);
    setValidCustomLocation(null);
  }

  // using jobDetails rather than something like isSuccess because a failed fetch, even after we have data set, seems to cause isSuccess to revert to false
  if (jobDetails) return <FixerConfirmation socket={socket} />;

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
            <label htmlFor='choosecurrent'>Current location</label>
            <input id='choosecurrent' type='radio' name='location' onClick={handleCurrentClick} checked={currentLocation ? true : false}/>
            <label htmlFor='choosecustom'>Custom location</label>
            <input id='choosecustom' type='radio' name='location' onClick={handleCustomClick} />
            <div id='querycontainer' className={toggleLocation ? 'show' : 'hide'}>
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
          <h2>Searching for work near you...</h2>
          <button type='button' onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </>
  )
}
export default QuickFix;