import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { faCar } from '@fortawesome/free-solid-svg-icons';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const CURRENT_URL = '/users/request/current';
const QUOTE_DECISION_URL = '/users/request/quote';
const REVISED_QUOTE_DECISION_URL = '/users/request/revised-quote'
const RATING_URL = '/users/request/rate-fixer';

const UserConfirmation = ({ socket, finalizing, cancellation, jobDetails, jobId, fixerName }) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  // const { data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const [cancelled, setCancelled] = useState(false);
  const mapRef = useRef();
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [viewState, setViewState] = useState({ 
    longitude: jobDetails?.userLocation[0],
    latitude: jobDetails?.userLocation[1],
    zoom: 12,
  });
  const [callToggle, setCallToggle] = useState(false);
  const [rated, setRated] = useState(false);
  const [active, setActive] = useOutletContext();
  const navigate = useNavigate();

  const handleLoad = () => {
    const line = lineString([[jobDetails.userLocation[0], jobDetails.userLocation[1]], [jobDetails.fixerLocation[0], jobDetails.fixerLocation[1]]]);
    const boundingBox = bbox(line);
    mapRef.current.fitBounds(boundingBox, { padding: 200 });
  }

  const handleAccept = async () => {
    await axiosPrivate.patch(QUOTE_DECISION_URL, {
      jobId: jobDetails.jobId,
      accept: true,
    });
  }

  const handleRevisedAccept = async () => {
    await axiosPrivate.patch(REVISED_QUOTE_DECISION_URL, {
      jobId: jobDetails.jobId,
      accept: true,
    })
  }

  const handleDecline = async () => {
    await axiosPrivate.patch(QUOTE_DECISION_URL, {
      jobId: jobDetails.jobId,
      accept: false,
    });
  }

  const handleRevisedDecline = async () => {
    await axiosPrivate.patch(REVISED_QUOTE_DECISION_URL, {
      jobId: jobDetails.jobId,
      accept: false,
    })
  }

  const handleCancel = () => {
    setActive(false);
    socket.emit('cancel job', {
      jobId: jobDetails.jobId, // add cancellation reason once the functionality is incorporated
    }, (response) => {
      if (response.status === 'NOK') {
        setActive(true);
        setErrMsg('Job cancellation failed');
      } else {
        setCancelled(true);
        queryClient.removeQueries(['request']);
        setTimeout(() => {
          navigate('/');
        }, 3000)
      }
    });
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
    console.log(fixerName);
    try {
      await axiosPrivate.patch(RATING_URL, {
        jobId,
        rating,
      });
    queryClient.removeQueries(['request']);
    } catch (err) {
      setRated(false);
      setErrMsg('Error submitting rating');
      errRef.current.focus();
    }
  }

  if (cancelled) return (
    <div>
      <h2>Job cancelled</h2>
      <p>Redirecting to home page...</p>
    </div>
  )

  if (cancellation) return ( // could list cancellation reason here in future build
    <div>
      <h2>The fixer has cancelled the job</h2>
      <p>Please contact us if you have any questions or concerns</p>
      <Link to='/'>Return to home page</Link>
    </div>
  )

  if (jobDetails?.trackerStage === 'en route') return (
    <>
      <Map
        {...viewState}
        ref={mapRef}
        onLoad={handleLoad}
        onMove={e => setViewState(e.viewState)}
        style={{width: '100vw', height: '100vh'}}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Marker longitude={jobDetails.fixerLocation[0]} latitude={jobDetails.fixerLocation[1]}>
          <FontAwesomeIcon icon={faCar} size='xl'/>
        </Marker>
        <Marker longitude={jobDetails.userLocation[0]} latitude={jobDetails.userLocation[1]}>
          <FontAwesomeIcon icon={faHouse} size='xl'/>
        </Marker>
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
        <h2>{jobDetails.fixerName} is on the way to {jobDetails.userAddress}!</h2>
        <ul>
          {jobDetails.fixerRating && <li>Fixer rating: {jobDetails.fixerRating}/5</li>}
          <li>ETA: {new Date(jobDetails.eta).toLocaleTimeString('en-US', { timeStyle: 'short' })}</li>
        </ul>
        <button type='button' onClick={() => {
          const line = lineString([[jobDetails.userLocation[0], jobDetails.userLocation[1]], [jobDetails.fixerLocation[0], jobDetails.fixerLocation[1]]]);
          const boundingBox = bbox(line);
          mapRef.current.fitBounds(boundingBox, { padding: 200 });
        }}>
          Re-center map
        </button>
        {!callToggle ? <div onClick={() => setCallToggle(true)} >Contact {jobDetails.fixerName}</div> : <div>{jobDetails.phoneNumber}</div>}
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
      {jobDetails?.quote?.pending === undefined 
        ? (
          <div>
            <h2>{jobDetails.fixerName} is arriving soon!</h2>
            <p>After arriving, {jobDetails.fixerName} will evaluate your repair needs<br />and send you a quote</p>
          </div>
          
        )
        : jobDetails.quote.pending ? (
        <div>
          <h2>Your quote</h2>
          <p>Estimated cost of work: ${jobDetails.quote.amount}</p>
          <p>Job details: {jobDetails.quote.details[jobDetails.quote.details.length - 1]}</p>
          <button type='button' onClick={handleAccept}>Accept</button>
          <button type='button' onClick={handleDecline}>Decline</button>
        </div>
      ) : <h2>Waiting on new quote...</h2>
      }
      <button type='button' onClick={handleCancel}>Cancel Job</button> 
    </div>
  )

  // deal with updated quote potentially coming in
  if (jobDetails?.trackerStage === 'fixing') return (
    <div>
      {!jobDetails?.quote?.revisedPending ? (
        <div>
          <h2>{jobDetails.fixerName} is working on your repair!</h2>
          <p>If your initial estimated cost changes it will be sent to you for your review</p>
        </div>
      ) : (
        <div>
          <h2>{jobDetails.fixerName} has sent you an updated estimate</h2>
          <p>Revised cost of work: ${jobDetails.quote.amount}</p>
          <p>Job details: {jobDetails.quote.details[jobDetails.quote.details.length - 1]}</p>
          <button type='button' onClick={handleRevisedAccept}>Accept</button>
          <button type='button' onClick={handleRevisedDecline}>Decline</button>
        </div>
      )}
      <p>Questions?</p>
      {!callToggle ? <div onClick={() => setCallToggle(true)} >Contact {jobDetails.fixerName}</div> : <div>{jobDetails.phoneNumber}</div>}
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
          <p>Rate {fixerName}</p>
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
          <Link to='/'>Return to home page</Link>
        </div>
      )}
    </div>
  )
}
export default UserConfirmation;