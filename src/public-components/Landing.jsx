import NavBar from '../base-components/PublicNavbar';
import { Link } from "react-router-dom";
import { faCalendarCheck } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWrench } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { faCreditCard } from '@fortawesome/free-regular-svg-icons';
import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { faStopwatch } from '@fortawesome/free-solid-svg-icons';

// TODO NEXT: need refresher on CSS flexbox and grid
// not sure if flexbox is best or even needed in these scenario (or grid for that matter)
// layout I'm envisioning is a sort of two column on desktop that goes down to one for mobile

const Landing = () => {
  return (
    <div className='landing'>
        <NavBar />
        <div className='section one'>
          <div className='flex-container'>
            <img src='/landing1-v2.jpg'/>
            <div>
              <h1 className='light'>Professional repair service</h1>
              <h1 className='bold'>on demand</h1>
            </div>
          </div>
        </div>
        <div className='background-div'>
          <div className='section two'>
            <div className='flex-container'>
              <div className='flex-subcontainer'>
                <div>
                  <h2>Working with fixerapp</h2>
                  <ul>
                    <li className='icon-one'><FontAwesomeIcon icon={faCalendarCheck} size='xl' className='calendar'/><span className='span-text one'>flexible hours</span></li>
                    <li><FontAwesomeIcon icon={faWrench} size='lg'/><span>on demand jobs</span></li>
                    <li><FontAwesomeIcon icon={faCheck} size='lg'/><span>easy to use</span></li>
                    <li><FontAwesomeIcon icon={faCreditCard} size='lg'/><span className='span-text'>get paid immediately</span></li>
                  </ul>
                </div>
                <Link to='/fixer-registration' className='sign-up'>Fixer sign up</Link>
              </div>
              <img src='/landing2-v2.jpg'/>
            </div>
          </div>
        </div>
        <div className='section three'>
          <div className='flex-container'>
            <img src='/landing3.jpg'/>
            <div className='flex-subcontainer'>
              <div>
                <h2>Hire a professional</h2>
                <ul>
                  <li className='icon-one'><FontAwesomeIcon icon={faThumbsUp} size='lg'/><span>fair and transparent pricing</span></li>
                  <li><FontAwesomeIcon icon={faCheck} size='lg'/><span>no hassle</span></li>
                  <li><FontAwesomeIcon icon={faStopwatch} size='lg'/><span className='stopwatch-text'>hire on demand or schedule at your convenience</span></li>
                </ul>
              </div>
              <Link to='/user-registration' className='sign-up'>Client sign up</Link>
            </div>
          </div>
        </div>
    </div>
  )
}
export default Landing