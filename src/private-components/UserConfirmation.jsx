import { useState, useRef } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl';
import { faCircleXmark, faClock } from '@fortawesome/free-regular-svg-icons';
import { faCar, faHouse, faScrewdriverWrench, faPhone, faStar, faChevronUp, faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';
import useLocalStorage from '../hooks/useLocalStorage';
import bbox from '@turf/bbox';
import { lineString } from '@turf/helpers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const QUOTE_DECISION_URL = '/users/request/quote';
const REVISED_QUOTE_DECISION_URL = '/users/request/revised-quote'
const RATING_URL = '/users/request/rate-fixer';

const UserConfirmation = ({ socket, finalizing, cancellation, jobDetails, jobId, fixerName }) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [cancelled, setCancelled] = useState(false);
  const mapRef = useRef();
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [viewState, setViewState] = useState({ 
    longitude: jobDetails?.userLocation[0],
    latitude: jobDetails?.userLocation[1],
    zoom: 12,
  });
  const [detailsToggle, setDetailsToggle] = useState(false);
  const [notesToggle, setNotesToggle] = useState(false);
  const [personalNotes, setPersonalNotes] = useLocalStorage('notes', 'Type any notes you want that you find helpful! For your eyes only.');
  const [rated, setRated] = useState(false);
  const { active, setActive, mapHeight, portrait, mobile, scrollY } = useOutletContext();
  const [mobileToggle, setMobileToggle] = useState(false);
  const navigate = useNavigate();

  const handleLoad = () => {
    const line = lineString([[jobDetails.userLocation[0], jobDetails.userLocation[1]], [jobDetails.fixerLocation[0], jobDetails.fixerLocation[1]]]);
    const boundingBox = bbox(line);
    mapRef.current.fitBounds(boundingBox);
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
      jobId: jobDetails.jobId,
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
    try {
      await axiosPrivate.patch(RATING_URL, {
        jobId,
        rating,
      });
    queryClient.removeQueries(['request']);
    setTimeout(() => {
      navigate('/');
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

  if (cancellation) return (
    <div className='cancelled'>
      <h2>The fixer has cancelled the job</h2>
      <p>Please contact us if you have any questions or concerns</p>
      <Link to='/'>Return to home page</Link>
    </div>
  )

  if (jobDetails?.trackerStage === 'en route') return (
    <>
      <div className={errMsg ? 'errmsg' : 'offscreen'} style={{ top: scrollY ? `calc(50% + ${scrollY}px)` : '50%' }}>
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
        ref={mapRef}
        onLoad={handleLoad}
        onMove={e => setViewState(e.viewState)}
        style={{ width: '100vw', height: mapHeight, minHeight: 576, minWidth: 320 }}
        mapStyle='mapbox://styles/mapbox/streets-v12'
        mapboxAccessToken={MAPBOX_TOKEN}
        padding={
          !portrait && !mobile 
            ? { left: window.innerWidth * 0.27 > 425 ? 425 + 23 + 50 : window.innerWidth * 0.27 > 276 ? (window.innerWidth * 0.27) + 23 + 50 : 276 + 23, top: 50, right: 50, bottom: 50 }
            : { left: 50, top: 50, right: 50, bottom: 98.5 + 23 + 50 }
        }
      >
        <Marker longitude={jobDetails.fixerLocation[0]} latitude={jobDetails.fixerLocation[1]}>
          <FontAwesomeIcon icon={faCar} size='xl'/>
        </Marker>
        <Marker longitude={jobDetails.userLocation[0]} latitude={jobDetails.userLocation[1]}>
          <FontAwesomeIcon icon={faHouse} size='xl'/>
        </Marker>
        <button type='button' onClick={() => {
          const line = lineString([[jobDetails.userLocation[0], jobDetails.userLocation[1]], [jobDetails.fixerLocation[0], jobDetails.fixerLocation[1]]]);
          const boundingBox = bbox(line);
          mapRef.current.fitBounds(boundingBox);
        }} className='btn re-center'>
          Re-center map
        </button>
      </Map>
      {((portrait || mobile) && !mobileToggle) && (
        <div className='mobile-btn show-content'>
          <button onClick={() => setMobileToggle(true)}><FontAwesomeIcon icon={faChevronUp} size='3x'/></button>
          <h2>JOB DETAILS</h2>
      </div>
      )} 
      {((portrait || mobile) && mobileToggle) && (
        <div className='mobile-btn hide-content'>
          <button onClick={() => setMobileToggle(false)}><FontAwesomeIcon icon={faChevronDown} size='3x'/></button>
        </div>
      )}
      <div 
        className={
        !portrait && !mobile 
          ? 'sidebar confirmation' 
          : !mobileToggle
            ? 'hide'
            : 'mobile confirmation'
            }
      >
        <div className='flex-container-mobile'>
          <h2>JOB DETAILS</h2>
          <table>
            <tbody>
              <tr>
                <td><FontAwesomeIcon icon={faCar} size='lg' className='icon'/></td>
                <td>{jobDetails.fixerName}</td>
              </tr>
              <tr>
                <td><FontAwesomeIcon icon={faStar} size='lg' className='icon'/></td>
                <td>{jobDetails.fixerRating}</td>
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
            </tbody>
          </table>
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
    <div className='post-en-route clients flex-container'>
      <div className={errMsg ? 'errmsg' : 'offscreen'} style={{ top: scrollY ? `calc(50% + ${scrollY}px)` : '50%' }}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
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
                    <td><FontAwesomeIcon icon={faScrewdriverWrench} size='lg'/></td>
                    <td>{jobDetails.fixerName}</td>
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
                  if (personalNotes.length >= 500) {
                    setErrMsg('Personal notes must be 500 characters or less');
                    errRef.current.focus();
                  }
                  setPersonalNotes(e.target.value);
                }}
              />
            </li>
          )}
        </ul>
      </div>
      {jobDetails?.quote?.pending === undefined 
        ? (
          <div className='flex-item two info-secondary'>
            <h2>Arrival</h2>
            <p>{jobDetails.fixerName} will soon be arriving to evaluate your repair needs and send you a quote</p>
            <div className='cancel'>    
              <p className='cancel-p'>Need to cancel this job?</p>
              <div className='cancel-button'>
                <button type='button' onClick={handleCancel}>Click here</button>
              </div>
            </div>
          </div>
          
        )
        : jobDetails.quote.pending ? (
        <div className='flex-item two info-secondary main'>
          <h2>Quote</h2>
          <div className='quote-container'>
            <div className='header-div'>
              <h2>Estimated Cost</h2>
              <h2>${jobDetails.quote.amount}</h2>
            </div>
            <div className='body-div'>
              <p className='quote-p'>{jobDetails.quote.details[jobDetails.quote.details.length - 1]}</p>
            </div>
            <p className='note-p'>Note: if the estimated cost of repair changes, we will notify you for approval before proceeding</p>
          </div>
          <div className='button-container'>
            <button type='button' onClick={handleAccept} className='btn'>Accept</button>
            <button type='button' onClick={handleDecline} className='btn'>Decline</button>
          </div>
          <div className='cancel'>    
            <p className='cancel-p'>Need to cancel this job?</p>
            <div className='cancel-button'>
              <button type='button' onClick={handleCancel}>Click here</button>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex-item two info-secondary'>
          <h2>Quote Pending</h2>
          <p>Please wait while {jobDetails.fixerName} updates your quote...</p>
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

  if (jobDetails?.trackerStage === 'fixing') return (
    <div className='post-en-route clients flex-container'>
      <div className={errMsg ? 'errmsg' : 'offscreen'} style={{ top: scrollY ? `calc(50% + ${scrollY}px)` : '50%' }}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
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
                    <td><FontAwesomeIcon icon={faScrewdriverWrench} size='lg'/></td>
                    <td>{jobDetails.fixerName}</td>
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
                  if (personalNotes.length >= 500) {
                    setErrMsg('Personal notes must be 500 characters or less');
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
        <div className='flex-item two info-secondary'>
          <h2>{jobDetails.fixerName} is working on your repair!</h2>
          <p>If your initial estimated cost changes it will be sent to you for your review</p>
          <div className='cancel'>    
            <p className='cancel-p'>Need to cancel this job?</p>
            <div className='cancel-button'>
              <button type='button' onClick={handleCancel}>Click here</button>
            </div>
          </div>
        </div>
      ) : (
        <div className='flex-item two info-secondary main'>
          <h2>Updated Quote</h2>
          <div className='quote-container'>
            <div className='header-div'>
              <h2>Revised Cost</h2>
              <h2>${jobDetails.quote.amount}</h2>
            </div>
            <div className='body-div'>
              <p className='quote-p'>{jobDetails.quote.details[jobDetails.quote.details.length - 1]}</p>
            </div>
            <p className='note-p'>Note: if the estimated cost of repair changes, we will notify you for approval before proceeding</p>
          </div>
          <div className='button-container'>
            <button type='button' onClick={handleRevisedAccept} className='btn'>Accept</button>
            <button type='button' onClick={handleRevisedDecline} className='btn'>Decline</button>
          </div>
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
      <div className={errMsg ? 'errmsg' : 'offscreen'} style={{ top: scrollY ? `calc(50% + ${scrollY}px)` : '50%' }}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
        {Array.isArray(errMsg) ? (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg[0]}
          <br />{errMsg[1]}</p>
        ) : (
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
        )}
      </div>  
      {!rated ? (
        <>
          <h2 className='job-complete'>Job Complete!</h2>
          <div className='rating'>
            <h2>Rate your experience with {fixerName}</h2>
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
export default UserConfirmation;