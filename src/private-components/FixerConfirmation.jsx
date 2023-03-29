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

const FixerConfirmation = ({ socket, finalizing: { finalizing, setFinalizing }, cancellation }) => {
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
    longitude: jobDetails?.fixerLocation[0],
    latitude: jobDetails?.fixerLocation[1],
    zoom: 12,
  });
  const [currentCoords, setCurrentCoords] = useState([]);
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
      coordinates: jobDetails?.fixerLocation?.coordinates,
    }
  }]
  })
  const [quote, setQuote] = useState(0);
  const [notes, setNotes] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [toggleWorkScope, setToggleWorkScope] = useState(false);
  const [revisedCost, setRevisedCost] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [clientName, setClientName] = useState('');
  const [jobId, setJobId] = useState('');
  const [rated, setRated] = useState(false);
  
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
      errRef.current.focus();
    }

    const id = navigator.geolocation.watchPosition(success, error, { timeout: 5000 });
    setWatchId(id);

    return () => {
      navigator.geolocation.clearWatch(id);
    }
  }, []);

  useEffect(() => {
    if (jobDetails?.eta && jobDetails?.trackerStage === 'en route') {
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
          errRef.current.focus();
        }
      }, etaTimeout);
      setTimeoutId(id);
    }

    return () => {
      clearTimeout(timeoutId);
    }
  }, [jobDetails?.eta])

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
    socket.emit('cancel job', {
      jobId: jobDetails.jobId, // add cancellation reason once the functionality is incorporated
    }, (response) => {
      if (response.status === 'NOK') {
        setErrMsg('Job cancellation failed');
        errRef.current.focus();
      } else {
        setCancelled(true);
        queryClient.removeQueries({ queryKey: ['request'], exact: true });
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
      await axiosPrivate.patch(COMPLETE_URL, {
        jobId: jobDetails.jobId,
      }); // could have this be an emitter and leave room on back end
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
    try {
      await axiosPrivate.patch(RATING_URL, {
        jobId,
        rating,
      });
    queryClient.removeQueries({ queryKey: ['request'], exact: true });
    } catch (err) {
      setRated(false);
      setErrMsg('Error submitting rating');
      errRef.current.focus();
    }
  }

  if (cancellation) return ( // could list cancellation reason here in future build
    <div>
      <h2>The client has cancelled the job</h2>
      <p>Please contact us if you have any questions or concerns</p>
      <Link to='/fixers'>Return to home page</Link>
    </div>
  )

  if (cancelled) return (
    <div>
      <h2>Job cancelled</h2>
      <Link to='/fixers'>Return to home page</Link>
    </div>
  )

  if (jobDetails?.trackerStage === 'en route') return (
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
        <Marker longitude={jobDetails.userLocation[0]} latitude={jobDetails.userLocation[1]} color='#c70a0a'/>
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
          <p>ETA: {jobDetails.eta.toLocaleTimeString('en-US', { timeStyle: 'short' })}</p>
          <button type='button' onClick={handleArrival}>I've arrived</button>
          {!callToggle ? <div onClick={() => setCallToggle(true)} >Contact Client</div> : <div>{jobDetails.phoneNumber}</div>}
        </div>
        <button type='button' onClick={handleCancel}>Cancel Job</button> {/* probably should add functionality for including and submitting cancellation reason
        and some sort of are you sure you want to cancel popup */}
      </div>
    </>
  )

  if (jobDetails?.trackerStage === 'arriving') return (
    <div>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive'>{errMsg}</p>
        )}
      </div>
      {!jobDetails?.quote?.pending ? (
      <>
        <form onSubmit={handleSubmitQuote}>
          {jobDetails?.quote?.pending === undefined  
            ? <label htmlFor='quote'>Client quote: $</label>
            : <label htmlFor='quote'>Updated client quote: $</label>
          }
          <input 
            id='quote'
            type='number'
            required
            value={quote || ''}
            step='0.01'
            onChange={e => setQuote(e.target.value)}
          />
          <textarea
            id='notes'
            value={notes}
            rows='30' // not sure about manually specifying this here...should consider other ways of doing this
            cols='75'
            onChange={e => {
              if (notes.length >= 1000) {
                setErrMsg('Notes must be 1000 characters or less');
                errRef.current.focus();
              }
              setNotes(e.target.value);
            }}
          >
            Describe quote details (1,000 characters or less){/* keep an eye on in the case this throws an error but don't think there's a syntax/escaping issue here */}
          </textarea>
          <button disabled={!quote || notes.length > 1000 ? true : false }>Send quote</button>
        </form>
      </>
      ) : <p>Client reviewing quote...</p>
      }
      <button type='button' onClick={handleCancel}>Cancel Job</button>
    </div> 
  )

  if (jobDetails?.trackerStage === 'fixing') return (
    <div>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive'>{errMsg}</p>
        )}
      </div>
      {!jobDetails.quote.pending ? (
        <div>
          <h2>Work started</h2>
          <textarea
            id='jobnotes'
            value={jobNotes}
            rows='30'
            cols='75'
            onChange={e => {
              if (jobNotes.length >= 1000) {
                setErrMsg('Job notes must be 1000 characters or less');
                errRef.current.focus();
              }
              setJobNotes(e.target.value);
            }}
          >
            Job notes (1,000 characters or less)
          </textarea>
          <p>Time started: {jobDetails?.workStartedAt?.toLocaleTimeString('en-US', { timeStyle: 'short' })}</p>
          {!callToggle ? <div onClick={() => setCallToggle(true)} >Contact Client</div> : <div>{jobDetails.phoneNumber}</div>}
          {!toggleWorkScope
            ? <button type='button' onClick={() => setToggleWorkScope(true)}>Update Work Scope</button>
            : (
              <form onSubmit={handleRevisedCost}>
                <label htmlFor='scopechange'>Revised Cost: $</label>
                <input
                  id='scopechange'
                  type='number'
                  step='0.01'
                  value={revisedCost || ''}
                  required
                  placeholder='Enter new total cost'
                  onChange={e => setRevisedCost(e.target.value)}
                />
                <textarea
                  id='additionalnotes'
                  value={additionalNotes}
                  rows='30'
                  cols='75'
                  onChange={e => {
                    if (additionalNotes.length >= 500) {
                      setErrMsg('Additional notes must be 1000 characters or less');
                      errRef.current.focus();
                    }
                    setAdditionalNotes(e.target.value);
                  }}
                >
                  Details regarding revised cost (500 characters or less)
                </textarea>
                <button disabled={!revisedCost || additionalNotes.length > 500 ? true : false }>Submit Revised Cost</button>
              </form>
            )}
          <button type='button' onClick={handleComplete}>Job Complete</button>
        </div>
      ) : (
        <p>Client reviewing revised cost...</p>
      )}
      <button type='button' onClick={handleCancel}>Cancel Job</button>
    </div>
  )

  if (jobDetails?.trackerStage === 'complete' || finalizing) return (
    <div>
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
        <div>
          <h2>Job complete!</h2>
          <p>Rate {clientName}</p>
          <form className='rating' onChange={handleRating}>
            <input type='radio' id='1-star' name='rating' value='1' />
            <input type='radio' id='2-star' name='rating' value='2' />
            <input type='radio' id='3-star' name='rating' value='3' />
            <input type='radio' id='4-star' name='rating' value='4' />
            <input type='radio' id='5-star' name='rating' value='5' />
          </form>
        </div>
      ) : (
        <div>
          <h2>Thank you for your feedback!</h2>
          <Link to='/fixers'>Return to home page</Link>
        </div>
      )}
    </div>
  )
}
export default FixerConfirmation;