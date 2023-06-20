import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faCar } from '@fortawesome/free-solid-svg-icons';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { faMap } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useLocalStorage from '../hooks/useLocalStorage';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import circle from '@turf/circle';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const CURRENT_URL = '/fixers/work/current';
const ARRIVAL_URL = '/fixers/work/arrival';
const DIRECTIONS_URL = '/fixers/work/directions';
const QUOTE_URL = '/fixers/work/quote';
const REVISED_COST_URL = '/fixers/work/revise-cost';
const COMPLETE_URL = '/fixers/work/complete';
const RATING_URL = '/fixers/work/rate-client';

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

let currentCoords;
let watchId = null;
let toId = null;

let testCoords;

// NOTES/TODO: add :disabled general class for .btn or specify for buttons in question
// double check handleRevisedCost is connected to stream change properly

const FixerConfirmation = ({ socket, finalizing: { finalizing, setFinalizing }, cancellation, jobDetails }) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  // const { isSuccess, data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const [cancelled, setCancelled] = useState(false);
  const mapRef = useRef();
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [timeoutId, setTimeoutId] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: jobDetails?.fixerLocation?.[0],
    latitude: jobDetails?.fixerLocation?.[1],
    zoom: 12,
  });
  const [callToggle, setCallToggle] = useState(false);
  const [route, setRoute] = useState({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: jobDetails?.route?.coordinates,
    }
  })
  const [geojsonPoint, setGeojsonPoint] = useState({
    type: 'FeatureCollection',
    features: [{
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: jobDetails?.fixerLocation,
    }
  }]
  })
  const [quote, setQuote] = useState(0);
  const [notes, setNotes] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [quoteMsg, setQuoteMsg] = useState(false);
  const [toggleWorkScope, setToggleWorkScope] = useState(false);
  const [revisedCost, setRevisedCost] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [clientName, setClientName] = useState('');
  const [jobId, setJobId] = useState('');
  const [rated, setRated] = useState(false);
  const [toggleDirections, setToggleDirections] = useState(false);
  const [mobileToggle, setMobileToggle] = useState(false);
  const [googleDirectionsUrl, setGoogleDirectionsUrl] = useState({
    origin: `&origin=${jobDetails?.fixerLocation[1]},${jobDetails?.fixerLocation[0]}`,
    destination: `&destination=${jobDetails?.userLocation[1]},${jobDetails?.userLocation[0]}`,
  });
  const [detailsToggle, setDetailsToggle] = useState(false);
  const [notesToggle, setNotesToggle] = useState(false);
  const [personalNotes, setPersonalNotes] = useLocalStorage('notes', 'Type any notes you want to help you with the job! For your eyes only.');
  const { active, setActive, mapHeight, portrait, mobile } = useOutletContext();
  const navigate = useNavigate();
  
  // for production
  /*useEffect(() => {
    const geofence = circle(jobDetails.userLocation, 0.25, { units: 'miles' });

    const success = pos => {
      const newCoords = [pos.coords.longitude, pos.coords.latitude]
      currentCoords = newCoords;
      if (booleanPointInPolygon(newCoords, geofence)) {
        socket.emit('arriving', jobDetails.jobId, async (response) => {
          if (response.status === 'OK') {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            clearTimeout(timeoutId);
            setTimeoutId(null);
          } else {
            try {
              await axiosPrivate.patch(ARRIVAL_URL, {
                jobId: jobDetails.jobId,
              });
              navigator.geolocation.clearWatch(watchId);
              watchId = null;
              clearTimeout(timeoutId);
              setTimeoutId(null);
            } catch (err) {
              setErrMsg('Error updating tracker stage');
              errRef.current.focus();
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
            coordinates: newCoords,
          }
        }]
        });
        console.log(geojsonPoint);
        console.log(`new coordinates are: ${newCoords}`);
        socket.emit('update location', {
          location: newCoords,
          jobId: jobDetails.jobId,
        });
      }
    }

    const error = err => {
      setErrMsg('Failed to get location data'); // might want more sophisticated error handling here
      errRef.current.focus();
    }

    if (jobDetails?.trackerStage === 'en route' && !watchId) {
      console.log('setting watch')
      const id = navigator.geolocation.watchPosition(success, error, { timeout: 5000 });
      watchId = id;
      console.log(`watch id is ${watchId}`);
    }
    
    return () => {
      console.log(`clearing watch: ${watchId}`);
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }, []);*/

  // for production
  /*useEffect(() => {
    if (timeoutId && jobDetails?.trackerStage && jobDetails.trackerStage !== 'en route') {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    if (jobDetails?.eta && jobDetails?.trackerStage === 'en route') {
      console.log(`eta is ${jobDetails.eta}`);
      let etaTimeout = new Date(jobDetails.eta) - new Date();

      console.log(`eta timeout is ${etaTimeout}`);

      if (etaTimeout < 0) {
        etaTimeout = 30000;
      }
      clearTimeout(timeoutId);
      setTimeoutId(null);
      const id = setTimeout(async () => {
        try {
          const directionsResponse = await axiosPrivate.patch(DIRECTIONS_URL, {
            jobId: jobDetails.jobId,
            location: currentCoords, // not sure if this will be stale. if it is, change to regular let variable
          });
          setRoute({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: directionsResponse.data.route.coordinates,
            }
          })
          // const line = lineString(route);
          const boundingBox = bbox(route);
          mapRef.current.fitBounds(boundingBox, { padding: 100 });
          queryClient.setQueryData(['request'], oldData => {
            return {
              ...oldData,
              ...directionsResponse.data,
            }
          });
        } catch (err) {
          setErrMsg('Error occurred when trying to update directions data');
          errRef.current.focus();
        }
      }, etaTimeout);
      setTimeoutId(id);
      toId = id;
    }

    return () => {
      clearTimeout(toId);
      toId = null;
      setTimeoutId(null);
    }
  }, [jobDetails?.eta, jobDetails?.trackerStage])
  */

  useEffect(() => {
    if (personalNotes.length <= 1000) {
      setErrMsg('');
    }

  }, [personalNotes]);

  useEffect(() => {
    if (notes.length <= 1000) {
      setErrMsg('');
    }

  }, [notes]);

  useEffect(() => {
    if (jobNotes.length <= 1000) {
      setErrMsg('');
    }

  }, [jobNotes]);

  useEffect(() => {
    if (additionalNotes.length <= 500) {
      setErrMsg('');
    }

  }, [additionalNotes])

  const handleLoad = () => {
    // const line = lineString(route);
    const boundingBox = bbox(route);
    mapRef.current.fitBounds(boundingBox);
  }

  // this function is for testing purposes only
  // NOTE: may add route api call to get updated routing and clean up/add more mapping features
  // but the main reason for the location updates are for the benefit of the
  // client to see where the fixer is at in real time, not as a mapping app
  // for the fixer to get real time directions
  // in reality I wouldn't think it worth it to re-invent the wheel/bloat the application/add cost 
  // when fixers will use Google Maps or similar for real time directions
  // the purpose of the map for the fixer is as a starting point/visual aid and again, in general, the main to benefit is to the client
  const handleTestMapClick = e => {
    const geofence = circle(jobDetails.userLocation, 0.25, { units: 'miles' });

    testCoords = [e.lngLat.lng, e.lngLat.lat];

    if (booleanPointInPolygon(testCoords, geofence)) {
      socket.emit('arriving', jobDetails.jobId, async (response) => {
        if (response.status === 'OK') {
          // navigator.geolocation.clearWatch(watchId);
          watchId = null;
          clearTimeout(timeoutId);
          setTimeoutId(null);
        } else {
          try {
            await axiosPrivate.patch(ARRIVAL_URL, {
              jobId: jobDetails.jobId,
            });
            // navigator.geolocation.clearWatch(watchId);
            watchId = null;
            clearTimeout(timeoutId);
            setTimeoutId(null);
          } catch (err) {
            setErrMsg('Error updating tracker stage');
            errRef.current.focus();
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
          coordinates: testCoords,
        }
      }]
      });
      console.log(geojsonPoint);
      console.log(`new coordinates are: ${testCoords}`);
      socket.emit('update location', {
        location: testCoords,
        jobId: jobDetails.jobId,
      });
    }

  }

  const handleArrival = () => {
    socket.emit('arriving', jobDetails.jobId, async (response) => {
      if (response.status === 'OK') {
        console.log(`CLEARING WATCH: ${watchId}`);
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        clearTimeout(timeoutId);
        setTimeoutId(null);
      } else {
        try {
          await axiosPrivate.patch(ARRIVAL_URL, {
            jobId: jobDetails.jobId,
          })
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
          clearTimeout(timeoutId);
          setTimeoutId(null);
        } catch (err) {
          setErrMsg('Error updating tracker stage');
          errRef.current.focus();
        }
      }
    });
  }

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!quote || notes.length > 1000) {
      setErrMsg('Invalid entry');
      errRef.current.focus();
      return;
    }

    try {
      await axiosPrivate.patch(QUOTE_URL, {
        quote,
        notes,
        jobId: jobDetails.jobId,
      });
  
      setQuote(0);
    } catch (err) {
      setErrMsg('Failed to submit quote')
      errRef.current.focus();
    }
  }

  const handleCancel = () => {
    setActive(false);
    socket.emit('cancel job', {
      jobId: jobDetails.jobId, // add cancellation reason once the functionality is incorporated
    }, (response) => {
      if (response.status === 'NOK') {
        setActive(true);
        setErrMsg('Job cancellation failed');
        errRef.current.focus();
      } else {
        setCancelled(true);
        queryClient.removeQueries(['request']);
        setTimeout(() => {
          navigate('/fixers');
        }, 3000)
      }
    });
  }

  const handleRevisedCost = async (e) => {
    e.preventDefault();
    if (!revisedCost || additionalNotes.length > 500) {
      setErrMsg('Invalid entry');
      errRef.current.focus();
      return;
    }

    try {
      await axiosPrivate.patch(REVISED_COST_URL, {
        revisedCost,
        notes: additionalNotes,
        jobId: jobDetails.jobId,
      });
      setToggleWorkScope(false);
      setQuoteMsg(true);
    } catch (err) {
      setErrMsg('Failed to update cost');
      errRef.current.focus();
    }
    
  }

  // not adding payment functionality at the moment but could easily add something like Stripe in the future
  const handleComplete = async () => {
    try {
      setClientName(jobDetails.firstName);
      setJobId(jobDetails.jobId);
      setFinalizing(true);
      const temporaryJobId = jobDetails.jobId;
      await axiosPrivate.patch(COMPLETE_URL, {
        jobId: jobDetails.jobId,
        jobNotes,
      });
      setActive(false);
      socket.emit('leave room', { jobId: temporaryJobId });
    } catch (err) {
      setFinalizing(false);
      setErrMsg('Failed to update job status');
      errRef.current.focus();
    }
  }

  const handleRating = async (e) => {
    e.preventDefault();
    const rating = e.currentTarget.rating.value;
    if (!rating || rating < 1 || rating > 5) {
      setErrMsg('Invalid entry');
      errRef.current.focus();
      return;
    }
    setRated(true);
    console.log(jobId);
    console.log(rating);
    try {
      await axiosPrivate.patch(RATING_URL, {
        jobId,
        rating,
      });
    queryClient.removeQueries(['request']);
    setTimeout(() => {
      navigate('/fixers');
    }, 3000);
    } catch (err) {
      setRated(false);
      setErrMsg('Error submitting rating');
      errRef.current.focus();
    }
  }

  if (cancelled) return (
    <div className='cancelled'>
      <h2>Job cancelled</h2>
      <p>Redirecting to home page...</p>
    </div>
  )

  if (cancellation) return ( // could list cancellation reason here in future build
    <div className='cancelled'>
      <h2>The client has cancelled the job</h2>
      <p>Please contact us if you have any questions or concerns</p>
      <Link to='/fixers'>Return to home page</Link>
    </div>
  )

  if (jobDetails?.trackerStage === 'en route') return (
    <>
      <Map
        {...viewState}
        ref={mapRef}
        onLoad={handleLoad}
        onClick={handleTestMapClick}
        onMove={e => setViewState(e.viewState)}
        style={{ width: '100vw', height: mapHeight, minHeight: portrait || mobile ? 500 : 700, minWidth: 320 }}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
        padding={
          !portrait && !mobile 
            ? { left: window.innerWidth * 0.27 > 425 ? 425 + 23 + 50 : window.innerWidth * 0.27 > 276 ? (window.innerWidth * 0.27) + 23 + 50 : 276 + 23, top: 50, right: 50, bottom: 50 }
            : { left: 50, top: 50, right: 50, bottom: 98.5 + 23 + 50 }
        }
      >
        
        <Marker longitude={jobDetails.userLocation[0]} latitude={jobDetails.userLocation[1]}>
          <FontAwesomeIcon icon={faHouse} size='xl' />
        </Marker>
        <Marker longitude={jobDetails.route.coordinates[0][0]} latitude={jobDetails.route.coordinates[0][1]}>
          <FontAwesomeIcon icon={faFlagCheckered} size='xl' />
        </Marker>
        <Source id='fixer-location' type='geojson' data={geojsonPoint}>
          <Layer {...pointLayerStyle} />
        </Source>
        <Source id='route-data' type='geojson' data={route}>
          <Layer {...routeLayerStyle} />
        </Source>
        <button type='button' onClick={() => {
          const line = lineString([[jobDetails.route.coordinates[0][0], jobDetails.route.coordinates[0][1]], [jobDetails.userLocation[0], jobDetails.userLocation[1]]]);
          const boundingBox = bbox(line);
          mapRef.current.fitBounds(boundingBox);
        }} className='btn re-center'>
          Re-center map
        </button>
      </Map>
      {((portrait || mobile) && !mobileToggle) && (
        <div className='mobile-btn show-content fixers'>
          <button onClick={() => setMobileToggle(true)}><FontAwesomeIcon icon={faChevronUp} size='3x'/></button>
          <h2>JOB DETAILS</h2>
      </div>
      )} 
      {((portrait || mobile) && mobileToggle) && (
        <div className='mobile-btn hide-content fixers'>
          <button onClick={() => setMobileToggle(false)}><FontAwesomeIcon icon={faChevronDown} size='3x'/></button>
        </div>
      )}
      <div 
        className={
        !portrait && !mobile 
          ? 'sidebar confirmation fixers' 
          : !mobileToggle
            ? 'hide'
            : 'mobile confirmation fixers'
            }
      >
        <div className={errMsg ? 'errmsg' : 'offscreen'}>
          <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
          {Array.isArray(errMsg) ? (
            <p ref={errRef} aria-live='assertive'>{errMsg[0]}
            <br />{errMsg[1]}</p>
          ) : (
            <p ref={errRef} aria-live='assertive'>{errMsg}</p>
          )}
        </div>
        <div className='flex-container-mobile fixers'>
          <h2>JOB DETAILS</h2>
          <table>
            <tbody>
              <tr>
                <td><FontAwesomeIcon icon={faUser} size='lg' className='icon'/></td>
                <td>{jobDetails.firstName} {jobDetails.lastName}</td>
              </tr>
              <tr>
                <td><FontAwesomeIcon icon={faPhone} size='lg' className='icon'/></td>
                <td>{jobDetails.phoneNumber}</td>
              </tr>
              <tr>
                <td><FontAwesomeIcon icon={faClock} size='lg' className='icon'/></td>
                <td>ETA {new Date(jobDetails.eta).toLocaleTimeString('en-US', { timeStyle: 'short' })}</td>
              </tr>
              <tr>
                <td><FontAwesomeIcon icon={faHouse} size='lg' className='icon'/></td>
                <td>{jobDetails.userAddress}</td>
              </tr>
              {(!mobile && !portrait) 
                && (
                  <tr>
                    <td className='chevron-td'>
                      <div className='chevron-btn'>
                        <button onClick={() => setToggleDirections(prev => !prev)}>
                          {!toggleDirections 
                            ? <FontAwesomeIcon icon={faChevronRight} size='lg' className='icon'/> 
                            : <FontAwesomeIcon icon={mobile || portrait ? faChevronUp : faChevronDown} size='lg' className='icon'/>
                          }
                        </button>
                        {toggleDirections && (
                          <div 
                            className='directions' 
                            style={!portrait && !mobile 
                              ? { width: window.innerWidth * 0.27 > 425 ? 425 * 0.86 : window.innerWidth * 0.27 > 276 ? (window.innerWidth * 0.27) * 0.86 : 276 * 0.86 }
                              : { width: (window.innerWidth * 0.27) * 0.86 }
                            }
                          >
                            <ol>
                              {jobDetails.route.instructions.map((step, index) => <li key={index}>{step}</li>)}
                            </ol>
                          </div>
                        )}{/* TODO: limit number of instruction steps (e.g., if more than 10) and add pagination */}
                      </div>
                    </td>
                    <td>{!toggleDirections ? 'Show directions' : 'Hide directions'}</td>
                  </tr>
              )}
              <tr>
                <td><FontAwesomeIcon icon={faMap} size='lg' className='icon'/></td>
                <td>
                  <a href={`https://www.google.com/maps/dir/?api=1${googleDirectionsUrl.origin}${googleDirectionsUrl.destination}`} target='_blank'>
                    Directions via Google Maps
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <button type='button' onClick={handleArrival} className='arrival btn'>I've arrived</button>
          <div className='cancel'>    
            <p className='cancel-p'>Need to cancel this job?</p>
            <div className='cancel-button'>
              <button type='button' onClick={handleCancel}>Click here</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (jobDetails?.trackerStage === 'arriving') return (
    <div className='post-en-route fixers flex-container'>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive'>{errMsg}</p>
        )}
      </div>
      <div className='flex-item one'>
        <ul>
          <li style={{ marginBottom: !detailsToggle ? 42 :  20 }}>
            <button type='button' onClick={() => setDetailsToggle(prev => !prev)}>
              <FontAwesomeIcon icon={!detailsToggle ? faChevronRight : faChevronDown} size='lg' className='chevron'/><span>Job details</span>
            </button>
          </li>
          {detailsToggle && (
            <li className='job-details'>
              <table>
                <tbody>
                  <tr>
                    <td><FontAwesomeIcon icon={faUser} size='lg'/></td>
                    <td>{jobDetails.firstName} {jobDetails.lastName}</td>
                  </tr>
                  <tr>
                    <td><FontAwesomeIcon icon={faPhone} size='lg'/></td>
                    <td>{jobDetails.phoneNumber}</td>
                  </tr>
                  <tr>
                    <td><FontAwesomeIcon icon={faHouse} size='lg'/></td>
                    <td>{jobDetails.userAddress}</td>
                  </tr>
                </tbody>
              </table>
            </li>
          )}
          <li className='notes-li'>
            <button type='button' onClick={() => setNotesToggle(prev => !prev)}>
              <FontAwesomeIcon icon={!notesToggle ? faChevronRight : faChevronDown} size='lg' className='chevron'/><span>Personal notes</span>
            </button>
          </li>
          {notesToggle && (
            <li className='personal-notes'>
              <textarea 
                id='personal-notes'
                className='on-focus'
                value={personalNotes}
                onChange={e => {
                  if (personalNotes.length > 1000) {
                    setErrMsg(`Personal notes must be 1000 characters or less, delete ${personalNotes.length - 1000} characters`);
                    errRef.current.focus();
                  }
                  setPersonalNotes(e.target.value);
                }}
              />
            </li>
          )}
        </ul>
      </div>
      {!jobDetails?.quote?.pending ? (
      <div className='flex-item two'>
        <form onSubmit={handleSubmitQuote}>
          <h2>Client Quote</h2>
          <label htmlFor='quote' className='left'>
            {jobDetails?.quote?.pending === undefined ? 'Quote amount' : 'Updated quote amount'}
            <div className='dollar-div on-focus'>
              <div>$</div>
              <input
                className='left on-focus' 
                id='quote'
                type='number'
                required
                value={quote || ''}
                step='0.01'
                onChange={e => setQuote(e.target.value)}
              />
            </div>
          </label>
          <textarea
            id='notes'
            className='main-textarea on-focus'
            value={notes}
            placeholder='Description of quote...'
            onChange={e => {
              if (notes.length > 1000) {
                setErrMsg(`Quote description must be 1000 characters or less, delete ${notes.length - 1000} characters`);
                errRef.current.focus();
              }
              setNotes(e.target.value);
            }}
          >
            Describe quote details (1,000 characters or less){/* keep an eye on in the case this throws an error but don't think there's a syntax/escaping issue here */}
          </textarea>
          <button disabled={!quote || !notes.length || notes.length > 1000 ? true : false } className='btn'>Send quote</button>
          <div className='cancel'>    
            <p className='cancel-p'>Need to cancel this job?</p>
            <div className='cancel-button'>
              <button type='button' onClick={handleCancel}>Click here</button>
            </div>
          </div>
        </form>
      </div>
      ) : (
        <div className='flex-item two info-secondary'>
            <h2>Pending</h2>
            <p>Client reviewing quote...</p>
            <div className='cancel'>    
              <p className='cancel-p'>Need to cancel this job?</p>
              <div className='cancel-button'>
                <button type='button' onClick={handleCancel}>Click here</button>
              </div>
          </div>
        </div>
      )
      }
    </div> 
  )

  if (jobDetails?.trackerStage === 'fixing') return (
    <div className='post-en-route fixers flex-container'>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive'>{errMsg}</p>
        )}
      </div>
      <div className='flex-item one'>
        <ul>
          <li style={{ marginBottom: !detailsToggle ? 42 :  20 }}>
            <button type='button' onClick={() => setDetailsToggle(prev => !prev)}>
              <FontAwesomeIcon icon={!detailsToggle ? faChevronRight : faChevronDown} size='lg' className='chevron'/><span>Job details</span>
            </button>
          </li>
          {detailsToggle && (
            <li className='job-details'>
              <table>
                <tbody>
                  <tr>
                    <td><FontAwesomeIcon icon={faUser} size='lg'/></td>
                    <td>{jobDetails.firstName} {jobDetails.lastName}</td>
                  </tr>
                  <tr>
                    <td><FontAwesomeIcon icon={faPhone} size='lg'/></td>
                    <td>{jobDetails.phoneNumber}</td>
                  </tr>
                  <tr>
                    <td><FontAwesomeIcon icon={faHouse} size='lg'/></td>
                    <td>{jobDetails.userAddress}</td>
                  </tr>
                  <tr>
                    <td><FontAwesomeIcon icon={faClock} size='lg'/></td>
                    <td>{new Date(jobDetails.workStartedAt).toLocaleTimeString('en-US', { timeStyle: 'short' })} start time</td>
                  </tr>
                </tbody>
              </table>
            </li>
          )}
          <li className='notes-li'>
            <button type='button' onClick={() => setNotesToggle(prev => !prev)}>
              <FontAwesomeIcon icon={!notesToggle ? faChevronRight : faChevronDown} size='lg' className='chevron'/><span>Personal notes</span>
            </button>
          </li>
          {notesToggle && (
            <li className='personal-notes'>
              <textarea 
                id='personal-notes'
                className='on-focus'
                value={personalNotes}
                onChange={e => {
                  if (personalNotes.length > 1000) {
                    setErrMsg(`Personal notes must be 1000 characters or less, delete ${personalNotes.length - 1000} characters`);
                    errRef.current.focus();
                  }
                  setPersonalNotes(e.target.value);
                }}
              />
            </li>
          )}
        </ul>
      </div>
      {!jobDetails?.quote?.revisedPending ? (
        <div className='flex-item two main-secondary' style={{ gap: !toggleWorkScope ? 45 : 30 }}>
          {(jobDetails?.quote?.revisedPending === false && quoteMsg) && (
            <div className={jobDetails.quote.revisedAccepted ? 'quote-decision' : 'quote-decision declined'}>
              <div className='flex-container'>
                <FontAwesomeIcon icon={faInfoCircle} size='lg'/>
                {jobDetails.quote.revisedAccepted 
                  ? <p>Revised quote accepted</p>
                  : (
                    <div>
                      <p>Revised quote declined</p>
                      <p>Submit a new revised quote if client is interested</p>
                    </div>
                  )
                }
              </div>
              <button type='button' onClick={() => setQuoteMsg(false)} className='btn'>Close</button>
            </div>
          )}
          <h2>Work started</h2>
          {!toggleWorkScope
            ? (
              <>
                <div className='main-div'>
                  <textarea
                    id='jobnotes'
                    className='main-textarea on-focus'
                    value={jobNotes}
                    placeholder='Description of repairs performed'
                    required
                    onChange={e => {
                      if (jobNotes.length > 1000) {
                        setErrMsg('Job notes must be 1000 characters or less');
                        errRef.current.focus();
                      }
                      setJobNotes(e.target.value);
                    }}
                  >
                    Job notes (1,000 characters or less)
                  </textarea>
                  <div className='btn-div'>
                    <button type='button' onClick={() => setToggleWorkScope(true)} className='btn'>Revise quote</button>
                  </div>
                </div>
                <button type='button' onClick={handleComplete} disabled={!jobNotes ? true : false} className='btn complete'>Job complete</button>
              </>
            ) : (
              <form onSubmit={handleRevisedCost}>
                <div className='quote-div'>
                  <label htmlFor='scopechange' className='left'>
                    Revised quote amount
                    <div className='dollar-div on-focus'>
                      <div>$</div>
                      <input
                        className='left on-focus' 
                        id='scopechange'
                        type='number'
                        required
                        value={revisedCost || ''}
                        step='0.01'
                        placeholder='Enter new total cost'
                        onChange={e => setRevisedCost(e.target.value)}
                      />
                    </div>
                  </label>
                  {!mobile && <button type='button' onClick={() => setToggleWorkScope(false)} className='btn'>Cancel update</button>}
                </div>
                <textarea
                  id='additionalnotes'
                  className='main-textarea on-focus'
                  value={additionalNotes}
                  placeholder='Description of revised quote...'
                  onChange={e => {
                    if (additionalNotes.length > 500) {
                      setErrMsg('Additional notes must be 500 characters or less');
                      errRef.current.focus();
                    }
                    setAdditionalNotes(e.target.value);
                  }}
                >
                  Details regarding revised cost (500 characters or less)
                </textarea>
                {mobile ? (
                  <div id='submit-cancel-btns'>
                    <button id='submit-revised' disabled={!revisedCost || additionalNotes.length > 500 ? true : false } className='btn'>Submit revised quote</button>
                    <button id='cancel-update' type='button' onClick={() => setToggleWorkScope(false)} className='btn'>Cancel update</button>
                  </div>
                ) : (
                  <button id='submit-revised' disabled={!revisedCost || additionalNotes.length > 500 ? true : false } className='btn'>Submit revised quote</button>
                )}
              </form>
            )}
          <div className='cancel'>    
            <p className='cancel-p'>Need to cancel this job?</p>
            <div className='cancel-button'>
              <button type='button' onClick={handleCancel}>Click here</button>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex-item two info-secondary'>
          <h2>Pending</h2>
          <p>Client reviewing revised cost...</p>
          <div className='cancel'>    
            <p className='cancel-p'>Need to cancel this job?</p>
            <div className='cancel-button'>
              <button type='button' onClick={handleCancel}>Click here</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (jobDetails?.trackerStage === 'complete' || finalizing) return (
    <div className='finalizing'>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive'>{errMsg}</p>
        )}
      </div>
      {!rated ? (
        <>
          <h2 className='job-complete'>Job Complete!</h2>
          <div className='rating'>
            <h2>Rate your experience with {clientName}</h2>
            {!mobile ? (
              <form onChange={handleRating}>
                <input type='radio' id='1-star' name='rating' value='1' />
                <input type='radio' id='2-star' name='rating' value='2' />
                <input type='radio' id='3-star' name='rating' value='3' />
                <input type='radio' id='4-star' name='rating' value='4' />
                <input type='radio' id='5-star' name='rating' value='5' />
              </form>
            ) : (
              <form onSubmit={handleRating}>
                {/* TODO: need sub-flex-container for mobile
                    probably best to add state for rating to disable button w/ out valid rating
                    I think handleRating function should still work (need to test this out)
                    but if any issues at all should create a separate function for mobile that uses state
                */}
                <div>
                  <input type='radio' id='1-star' name='rating' value='1' />
                  <input type='radio' id='2-star' name='rating' value='2' />
                  <input type='radio' id='3-star' name='rating' value='3' />
                  <input type='radio' id='4-star' name='rating' value='4' />
                  <input type='radio' id='5-star' name='rating' value='5' />
                </div>
                <button className='btn'>Submit rating</button>
              </form>
            )}
          </div>
        </>
      ) : (
        <div className='post-rating'>
          <h2>Thank you for your feedback!</h2>
          <p>Redirecting to home page...</p>
        </div>
      )}
    </div>
  )
}
export default FixerConfirmation;