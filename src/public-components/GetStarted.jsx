import { useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../base-components/PublicNavbar';
import { faCalendarCheck } from '@fortawesome/free-regular-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { faArrowTurnUp } from '@fortawesome/free-solid-svg-icons';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { faCreditCard } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// css cover image for each (vertical split for large screens), display=none for opposite onclick...button at bottom to see opposite
const GetStarted = () => {
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showFixerInfo, setShowFixerInfo] = useState(false);
  const [showCover, setShowCover] = useState(true);

  const handleNavClick = () => {
    setShowCover(true);
    setShowFixerInfo(false);
    setShowUserInfo(false);
  }

  const handleUserClick = () => {
    setShowCover(false);
    setShowUserInfo(true);
  }

  const handleFixerClick = () => {
    setShowCover(false);
    setShowFixerInfo(true);
  }

  const handleUserClick2 = () => {
    setShowUserInfo(prev => !prev);
    setShowFixerInfo(prev => !prev);
  }

  const handleFixerClick2 = () => {
    setShowFixerInfo(prev => !prev);
    setShowUserInfo(prev => !prev);
  }

  // NOTE: minor issue with absolute positioning on buttons causing layout issues when images are loading
  // I think there are a couple potential ways to alleviate this, one of which is I suspect the browser cache is being invalidated when the refresh API call is made
  // could implement some form of cache-control, setting headers in express, but would need to make sure any solutions don't impact more critical functions
  // additionally, need a placeholder element and/or fallback
  // that allows the buttons to still be positioned correctly in cases where a) the image doesn't properly load or b) the image loads late
  return (
    <div className='learn-more-layout'>
        <NavBar onClick={handleNavClick} learnMore={true}/>
        
          {showCover && (
            <div className='flex-container'>
              <div className='column clients'>
                <button type='button' onClick={handleUserClick} className='btn'>Clients</button>
              </div>
              <div className='column fixers'>
                <button type='button' onClick={handleFixerClick} className='btn'>Fixers</button>
              </div>
            </div>
          )}

          {showUserInfo && (
            <section className='more-info'>
              <div className='title'>
                <h1 className='part1'>Getting your home repaired</h1>
                <h1 className='part2'>should be easy</h1>
              </div>
              <article>
                <p>Are you tired of trying to find a handyman the old fashioned way or general contractors
                not giving you the time of day? It can be difficult to know who to trust when it comes to 
                repairs in your home. Even if you find that person, overworked handymen may not be available 
                on a reliable timeframe that fits your needs. This is where fixerapp comes to the rescue with a 
                roster of qualified repair professionals in your local area. Our fixers are ready to help you on
                your schedule. To put it simply, this is what we offer:
                </p>
                <ul>
                  <li><FontAwesomeIcon icon={faCalendarCheck} size='xl' className='calendar'/><span className='calendar-text'>Service available when you need it</span></li>
                  <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90} size='xl'/><span className='arrow-text'>on demand or any time in the future, at your convenience</span></li>
                  <li><FontAwesomeIcon icon={faBan} size='xl'/><span>No more unnecessary phone calls to gather quotes</span></li>
                  <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90} size='xl'/><span className='arrow-text'>schedule through our app with a few clicks</span></li>
                  <li><FontAwesomeIcon icon={faCheck} size='xl'/><span>We only work with relaible professionals that meet our high standards</span></li>
                  <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90} size='xl'/><span className='arrow-text'>worry-free hiring process with guaranteed quality service</span></li>
                </ul>
                <Link to='/user-registration' className='sign-up'>Client sign up</Link>
                <p className='learn-more'>Interested in joining our roster of fixers?</p>
                <div className='learn-more-button'>
                  <button type='button' onClick={handleUserClick2}>Learn more</button>
                </div>
              </article>
            </section>
          )}

          {showFixerInfo && (
            <section className='more-info'>
              {window.innerWidth <= 480 ? (
                <div className='title'>
                  <h1 className='part1 mobile'>Let us help you</h1>
                  <h1 className='part1 mobile'>find clients</h1>
                  <h1 className='part2-fixer'>so you can</h1>
                  <h1 className='part3-fixer-mobile'>focus on the work</h1>
              </div>
              ) : (
                <div className='title'>
                  <h1 className='part1'>Let us help you find clients</h1>
                  <h1 className='part2-fixer'>so you can <span>focus on the work</span></h1>
                </div>
              )}
              <article>
                <p>Finding clients, handling phone calls, scheduling, and ensuring a steady flow of quality jobs 
                is a lot of work! Fixerapp lets you spend less of your time on mundane tasks that aren’t paying 
                and more time on the work that matters most. Whether you use the app full-time
                or part-time is up to you. You have complete flexibility with fixerapp to always make sure you
                have jobs when you need them. Here's what we can offer:
                </p>
                <ul>
                  <li><FontAwesomeIcon icon={faCalendarCheck} size='xl' className='calendar'/><span className='calendar-text'>Flexible hours that fit your needs</span></li>
                  <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90} size='xl'/><span className='arrow-text'>take on jobs as needed to build your perfect schedule</span></li>
                  <li><FontAwesomeIcon icon={faBan} size='xl'/><span>Stop wasting time on the phone, trying to figure out what will or won't be a quality job</span></li>
                  <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90} size='xl'/><span className='arrow-text'>let us do the heavy lifting when it comes to matching you with clients</span></li>
                  <li><FontAwesomeIcon icon={faCreditCard} size='xl'/><span className='cc-text'>Payment is handled by us so you get your money at time of service</span></li>
                  <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90} size='xl'/><span className='arrow-text'>streamlining payment lets you focus on the work and gives the client a convenient experience</span></li>
                </ul>
                <Link to='/fixer-registration' className='sign-up'>Fixer sign up</Link>
                <p className='learn-more'>Interested in the client process?</p>
                <div className='learn-more-button'>
                  <button type='button' onClick={handleFixerClick2}>Learn more</button>
                </div>
              </article>
            </section>
          )}
        
    </div>
  )
}
export default GetStarted