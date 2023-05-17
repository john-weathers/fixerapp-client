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

  return (
    <div>
        <NavBar onClick={handleNavClick}/>
        
          {showCover && (
            <div className='flex-container'>
              <div className='column'>
                <img src='/learnmore1.svg'/>
                <button type='button' onClick={handleUserClick} className='btn'>Clients</button>
              </div>
              <div className='column'>
                <img src='/learnmore2.svg'/>
                <button type='button' onClick={handleFixerClick} className='btn'>Fixers</button>
              </div>
            </div>
          )}

          {showUserInfo && (
            <div className='client-info'>
              <h1 className='title-part1'>Getting your home repaired</h1>
              <h1 className='title-part2'>should be easy</h1>
              <p>Are you tired of trying to find a handyman the old fashioned way or general contractors
              not giving you the time of day? It can be difficult to know who to trust when it comes to 
              repairs in your home. Even if you find that person, overworked handymen may not be available 
              on a reliable timeframe that fits your needs. This is where fixerapp comes to the rescue with a 
              roster of qualified repair professionals in your local area. Our fixers are ready to help you on
              your schedule. To put it simply, this is what we offer:
              </p>
              <ul>
                <li><FontAwesomeIcon icon={faCalendarCheck}/><span>Service available when you need it</span></li>
                <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90}/><span>on demand or any time in the future, at your convenience</span></li>
                <li><FontAwesomeIcon icon={faBan}/><span>No more unnecessary phone calls to gather quotes</span></li>
                <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90}/><span>schedule through our app with a few clicks</span></li>
                <li><FontAwesomeIcon icon={faCheck}/><span>We only work with relaible professionals that meet our high standards</span></li>
                <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90}/><span>worry-free hiring process with guaranteed quality service</span></li>
              </ul>
              <Link to='/user-registration' className='sign-up'>Client sign up</Link>
              <p>Interested in joining our roster of fixers?</p>
              <button type='button' onClick={handleUserClick2}>Learn more</button>
            </div>
          )}

          {showFixerInfo && (
            <div className='fixer-info'>
              <h1 className='title-part1'>Let us help you find clients</h1>
              <h1 className='title-part2'>so you can <span>focus on the work</span></h1>
              <p>Finding clients, handling phone calls, scheduling, and ensuring a steady flow of quality jobs 
              is a lot of work! Fixerapp lets you spend less of your time on mundane tasks that aren’t paying 
              you any money and more time on the work that matters most. Whether you use the app full-time
              or part-time is up to you. You have complete flexibility with fixerapp to always make sure you
              have jobs when you need them. Here's what we can offer:
              </p>
              <ul>
                <li><FontAwesomeIcon icon={faCalendarCheck}/><span>Flexible hours that fit your needs</span></li>
                <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90}/><span>take on jobs as needed to build your perfect schedule</span></li>
                <li><FontAwesomeIcon icon={faBan}/><span>Stop wasting time on the phone, trying to figure out what will or won't be a quality job</span></li>
                <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90}/><span>let us do the heavy lifting when it comes to matching you with clients</span></li>
                <li><FontAwesomeIcon icon={faCreditCard}/><span>Payment is handled by us so you get your money at time of service</span></li>
                <li><FontAwesomeIcon icon={faArrowTurnUp} rotation={90}/><span>streamlining payment lets you focus on the work and gives the client a convenient experience</span></li>
              </ul>
              <Link to='/fixer-registration' className='sign-up'>Fixer sign up</Link>
              <p>Interested in the client process?</p>
              <button type='button' onClick={handleFixerClick2}>Learn more</button>
            </div>
          )}
        
    </div>
  )
}
export default GetStarted