import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom"
import HoverNav from './HoverNav';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHammer } from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ onClick, learnMore }) => {
  const [url, setUrl] = useState(window.location.href);  


  return (
    <nav className='header'>
        <ul className='nav-container'>
            <li>
                <NavLink to='/' className='nav-link'>
                        <img src='/Hammer.svg' className='logo-img'/>
                        <h1 className='logo-part1'>fixer<span className='logo-part2'>app</span></h1>
                </NavLink>
            </li>
            <li className='nav-subcontainer'>
                <NavLink to='/get-started' onClick={onClick} className='nav-link'>Learn More</NavLink>
                <HoverNav title='Login' url={url}>
                    <ul className={learnMore ? 'nav-popout-learn-more' : 'nav-popout'}>
                        <li className='nav-popout-clients'>
                            <NavLink to='/user-login' className='nav-link' onClick={() => setUrl(window.location.href)}>Clients</NavLink>
                        </li>
                        <li className='nav-popout-fixers'>
                            <NavLink to='/fixer-login' className='nav-link' onClick={() => setUrl(window.location.href)}>Fixers</NavLink>
                        </li>
                    </ul>
                </HoverNav>
                <HoverNav title='Sign Up'>
                    <ul className={learnMore ? 'nav-popout-learn-more' : 'nav-popout'}>
                        <li className='nav-popout-clients'>
                            <NavLink to='/user-registration' className='nav-link'>Clients</NavLink>
                        </li>
                        <li className='nav-popout-fixers'>
                            <NavLink to='/fixer-registration' className='nav-link'>Fixers</NavLink>
                        </li>
                    </ul>
                </HoverNav>
            </li>
        </ul>
    </nav>
  )
}
export default NavBar;