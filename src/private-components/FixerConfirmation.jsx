import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import circle from '@turf/circle';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN }); // should be able to remove this and associated CDN reference
const CURRENT_URL = '/fixers/work/current';
const ARRIVAL_URL = '/fixers/work/arrival';
const DIRECTIONS_URL = '/fixers/work/directions';
const CANCEL_URL = '/fixer/work/cancel';
const ESTIMATE_URL = '/fixers/work/estimate';

const pointLayerStyle = {
  id: 'point',
  type: 'circle',
  // filter: ['==', '$type', 'Point'],
  paint: {
    'circle-radius': 10,
    'circle-color': '#007cbf',
  }
}

const routeLayerStyle = {
  id: 'route',
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  paint: {
    'line-color': '#3887be',
    'line-width': 5,
    'line-opacity': 0.75,
  }
}

const FixerConfirmation = ({ socket }) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const [cancelled, setCancelled] = useState(false);
  const mapRef = useRef();
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [watchId, setWatchId] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: jobDetails.fixerLocation[0],
    latitude: jobDetails.fixerLocation[1],
    zoom: 12,
  });
  const [currentCoords, setCurrentCoords] = useState([]);
  const [callToggle, setCallToggle] = useState(false);
  const [route, setRoute] = useState({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: jobDetails.route.coordinates,
    }
  })
  const [geojsonPoint, setGeojsonPoint] = useState({
    type: 'FeatureCollection',
    features: [{
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: jobDetails.fixerLocation.coordinates,
    }
  }]
  })

  // can use bbox, lineString (from turf) and fitBounds (from mapbox) to orient map once directions are available
  // might be best to return the fixer location (for fixers) to use as a starting point to orient the map
  // or do the initial directions api call in the findWork function (could be best)
  
  useEffect(() => {
    const geofence = circle(jobDetails.userLocation, 0.25, { units: 'miles' });

    const success = pos => {
      setCurrentCoords([pos.coords.longitude, pos.coords.latitude]);
      if (booleanPointInPolygon(currentCoords, geofence)) {
        socket.emit('arriving', jobDetails.jobId, async (response) => {
          if (response.status === 'OK') {
            navigator.geolocation.clearWatch(watchId);
            clearTimeout(timeoutId);
          } else {
            try {
              await axiosPrivate.patch(ARRIVAL_URL, {
                jobId: jobDetails.jobId,
              });
              navigator.geolocation.clearWatch(watchId);
              clearTimeout(timeoutId);
            } catch (err) {
              setErrMsg('Error updating tracker stage');
            }
          }
        });
      } else {
        setGeojsonPoint({
          type: 'FeatureCollection',
          features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: currentCoords,
          }
        }]
        })
        socket.emit('update location', {
          location: currentCoords,
          jobId: jobDetails.jobId,
        });
      }
    }

    const error = err => {
      setErrMsg(err.message); // might want more sophisticated error handling here
    }

    const id = navigator.geolocation.watchPosition(success, error, { timeout: 5000 });
    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    }
  }, []);

  useEffect(() => {
    if (jobDetails.eta && jobDetails.trackerStage === 'en route') {
    const etaTimeout = jobDetails.eta - new Date();
    
      const id = setTimeout(async () => {
        try {
          const directionsResponse = await axiosPrivate.patch(DIRECTIONS_URL, {
            jobId: jobDetails.jobId,
            location: currentCoords,
          });
          setRoute({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: directionsResponse.route.coordinates,
            }
          })
          const line = lineString(route);
          const boundingBox = bbox(line);
          mapRef.current.fitBounds(boundingBox, { padding: 100 });
          queryClient.setQueryData(['request'], oldData => {
            return {
              ...oldData,
              ...directionsResponse.data,
            }
          });
        } catch (err) {
          setErrMsg('Error occurred when trying to update directions data');
        }
      }, etaTimeout);
      setTimeoutId(id);
    }

    return () => {
      clearTimeout(timeoutId);
    }
  }, [jobDetails.eta])

  const handleLoad = () => {
    const line = lineString(route);
    const boundingBox = bbox(line);
    mapRef.current.fitBounds(boundingBox, { padding: 100 });
  }

  const handleArrival = () => {
    socket.emit('arriving', jobDetails.jobId, async (response) => {
      if (response.status === 'OK') {
        navigator.geolocation.clearWatch(watchId);
        clearTimeout(timeoutId);
      } else {
        try {
          await axiosPrivate.patch(ARRIVAL_URL, {
            jobId: jobDetails.jobId,
          })
          navigator.geolocation.clearWatch(watchId);
          clearTimeout(timeoutId);
        } catch (err) {
          setErrMsg('Error updating tracker stage');
        }
      }
    });
  }

  const handleCancel = () => {
    socket.emit('cancel job', {
      jobId: jobDetails.jobId, // add cancellation reason once the functionality is incorporated
    }, (response) => {
      if (response.status === 'NOK') {
        setErrMsg('Job cancellation failed');
      } else {
        setCancelled(true);
        queryClient.removeQueries({ queryKey: ['request'], exact: true });
      }
    });
  }

  if (jobDetails.trackerStage === 'en route') return (
    <>
      <Map
        {...viewState}
        ref={mapRef}
        onLoad={handleLoad}
        minZoom='11.5'
        maxZoom='19.5'
        onMove={e => setViewState(e.viewState)}
        style={{width: '100vw', height: '100vh'}}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Source id='fixer-location' type='geojson' data={geojsonPoint}>
          <Layer {...pointLayerStyle} />
        </Source>
        <Marker longitude={jobDetails.userLocation[0]} latitude={jobDetails.userLocation[1]} anchor='bottom' color='#c70a0a'/>
        <Source id='route-data' type='geojson' data={route}>
          <Layer {...routeLayerStyle} />
        </Source>
      </Map>
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
        <h2>Job found at {jobDetails.userAddress}</h2>
        <ul>
          <li>Client: {jobDetails.firstName} {jobDetails.lastName}</li>
        </ul>
        <div>
          <h3>Driving instructions</h3>
          <ol>
            {jobDetails.route.instructions.map((step, index) => <li key={index}>{step}</li>)}
          </ol>
          <p>ETA: {jobDetails.toLocaleTimeString('en-US', { timeStyle: 'short' })}</p>
          <button type='button' onClick={handleArrival}>I've arrived</button>
          {!callToggle ? <div onClick={() => setCallToggle(true)} >Contact Client</div> : <div>{jobDetails.phoneNumber}</div>}
        </div>
        <button type='button' onClick={handleCancel}>Cancel Job</button> {/* probably should add functionality for including and submitting cancellation reason
        and some sort of are you sure you want to cancel popup */}
      </div>
    </>
  )

  if (jobDetails.trackerStage === 'arriving') return (
    <>
    
    </>
  )

  if (jobDetails.trackerStage === 'estimating') return (
    <div>

    </div>
  )

  if (jobDetails.trackerStage === 'fixing') return (
    <div>

    </div>
  )

  if (jobDetails.trackerStage === 'complete') return (
    <div>
      
    </div>
  )

  if (cancelled) return (
    <div>
      <h2>Job cancelled</h2>
      <Link to='/fixers'>Return to home page</Link>
    </div>
  )

  return (
    <div>FixerConfirmation</div> // default return? would indicate some type of issue so could be a fallback to cancel the Request or similar
  )
}
export default FixerConfirmation;

// with tracker stages:
// en route: display map and directions (can reverseGeocode to get address...in production would likely require an address) setInterval for updating Fixer's location server side,
// method of updating tracker stage (could be a button on f/e or based on proximity), clear interval
// promiximity might be preferable for ease of use...for testing purposes we can use a button

// arriving: could potentially show customer details at this point (name, profile photo, etc.) or add more details once at this stage, such as showing the photo
// could also add functionality/information to give more details about repair issue earlier in the process and/or at this point
// prompt for estimated job cost, should go to customer, once accepted we move to fixing stage

// fixing: could possibly show timer on how long fix has been ongoing, but mainly we need to display a button to indicate job being finished
// this could trigger payment for customer (other option would be to handle payment when job starts, or a hybrid such as taking a deposit and charging the final amount
// depending on the job)