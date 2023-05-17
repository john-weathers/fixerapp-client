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
    <div id='landing'>
        <NavBar />
        <div>
          <img src='/landing1.svg'/>
          <h1>Professional repair service <span>on demand</span></h1>
        </div>
        <div>
          <h2>Working with fixerapp</h2>
          <ul>
            <li><FontAwesomeIcon icon={faCalendarCheck} className='bullet'/><span className='point'>flexible hours</span></li>
            <li><FontAwesomeIcon icon={faWrench} className='bullet'/><span className='point'>on demand jobs</span></li>
            <li><FontAwesomeIcon icon={faCheck} className='bullet'/><span className='point'>easy to use</span></li>
            <li><FontAwesomeIcon icon={faCreditCard} className='bullet'/><span className='point'>get paid immediately</span></li>
          </ul>
          <Link to='/fixer-registration' className='sign-up'>Fixer sign up</Link>
          <img src='/landing2.svg'/>
        </div>
        <div>
          <img src='/landing3.svg'/>
          <h2>Hire a professional</h2>
          <ul>
            <li><FontAwesomeIcon icon={faThumbsUp} className='bullet'/><span className='point'>fair and transparent pricing</span></li>
            <li><FontAwesomeIcon icon={faCheck} className='bullet'/><span className='point'>no hassle</span></li>
            <li><FontAwesomeIcon icon={faStopwatch} className='bullet'/><span className='point'>hire on demand or schedule at your convenience</span></li>
          </ul>
          <Link to='/user-registration' className='sign-up'>Client sign up</Link>
        </div>
    </div>
  )
}
export default Landing