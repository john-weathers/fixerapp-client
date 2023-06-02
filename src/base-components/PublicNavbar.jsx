import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet } from "react-router-dom"
import HoverNav from './HoverNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ onClick, learnMore }) => {
  const [url, setUrl] = useState(window.location.href);
  const [mobile, setMobile] = useState(window.innerWidth <= 480 ? true : false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [mobileHeight, setMobileHeight] = useState(null);

  useEffect(() => {
    // another approach could be using a scroll/wheel event to close the mobile dropdown menu
    const offsetHeight = document.getElementsByTagName('html')[0].offsetHeight;
    if (window.innerHeight > offsetHeight) {
        setMobileHeight(window.innerHeight)
    } else {
        setMobileHeight(offsetHeight);
    }
  }, [mobileOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setMobile(true);
      } else {
        setMobile(false);
      }
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleMobileClick = () => {
    setMobileOpen(false);
    setShowLogin(false);
    setShowSignUp(false);
  }

  const handleMobileMenuClick = () => {
    setMobileOpen(prev => !prev)
    setShowLogin(false);
    setShowSignUp(false);
  }

  const handleLoginClick = () => {
    setShowLogin(prev => !prev);
    setShowSignUp(false);
  }

  const handleSignUpClick = () => {
    setShowSignUp(prev => !prev);
    setShowLogin(false);
  }

  return (
    <nav className='header'>
        <ul className='nav-container'>
            <li className='home'>
                <NavLink to='/' className='nav-link home'>
                        <img src='/Hammer.svg' className='logo-img' alt='Hammer, credit: https://icons8.com/icon/100418/hammer'/>
                        <h1 className='logo-part1'>fixer<span className='logo-part2'>app</span></h1>
                </NavLink>
            </li>
            {mobile ? (
                <li className='nav-subcontainer-mobile'>
                    <img src='/menu.svg' onClick={handleMobileMenuClick}/>
                    {mobileOpen && (
                        <ul className='mobile-popout' style={mobileHeight ? { height: mobileHeight } : { height: '100%' }}>
                            <li className='nav-overlay' onClick={handleMobileClick}></li>
                            <li>
                                <NavLink to='/get-started' onClick={onClick} className='nav-link'>Learn More</NavLink>
                            </li>
                            <li 
                                onClick={handleLoginClick} 
                                className={url?.includes('/user-login') || url?.includes('/fixer-login') ? 'nav-title-active .mobile' : 'nav-title .mobile'}
                                style={showLogin ? { backgroundColor: '#F8F2F7' } : { backgroundColor: 'white' }}
                            >
                                Login
                            </li>
                            {showLogin && (
                                <ul className='sub-menu'>
                                    <li className='sub-one'>
                                        <NavLink to='/user-login' className='nav-link' onClick={() => setUrl(window.location.href)}>Clients</NavLink>
                                    </li>
                                    <li className='sub-two'>
                                        <NavLink to='/fixer-login' className='nav-link' onClick={() => setUrl(window.location.href)}>Fixers</NavLink>
                                    </li>
                                </ul>
                            )}
                            <li 
                                onClick={handleSignUpClick} 
                                className={url?.includes('/user-registration') || url?.includes('/fixer-registration') ? 'nav-title-active .mobile' : 'nav-title .mobile'}
                                style={showSignUp ? { backgroundColor: '#F8F2F7' } : { backgroundColor: 'white' }}
                            >
                                Sign Up
                            </li>
                            {showSignUp && (
                                <ul className='sub-menu'>
                                    <li className='sub-one'>
                                        <NavLink to='/user-registration' className='nav-link' onClick={() => setUrl(window.location.href)}>Clients</NavLink>
                                    </li>
                                    <li className='sub-two'>
                                        <NavLink to='/fixer-registration' className='nav-link' onClick={() => setUrl(window.location.href)}>Fixers</NavLink>
                                    </li>
                                </ul>
                            )}
                            <li className='body-overlay' onClick={handleMobileClick}></li>
                        </ul>
                    )}
                    
                </li>
            ) : (
                <li className='nav-subcontainer'>
                    <NavLink to='/get-started' onClick={onClick} className='nav-link'>Learn More</NavLink>
                    <HoverNav title='Login' active={url?.includes('/user-login') || url?.includes('/fixer-login') && true}>
                        <ul className='nav-popout'>
                            <li className='nav-popout-clients'>
                                <NavLink to='/user-login' className='nav-link' onClick={() => setUrl(window.location.href)}>Clients</NavLink>
                            </li>
                            <li className='nav-popout-fixers'>
                                <NavLink to='/fixer-login' className='nav-link' onClick={() => setUrl(window.location.href)}>Fixers</NavLink>
                            </li>
                        </ul>
                    </HoverNav>
                    <HoverNav title='Sign Up' active={url?.includes('/user-registration') || url?.includes('/fixer-registration') && true}>
                        <ul className='nav-popout'>
                            <li className='nav-popout-clients'>
                                <NavLink to='/user-registration' className='nav-link' onClick={() => setUrl(window.location.href)}>Clients</NavLink>
                            </li>
                            <li className='nav-popout-fixers'>
                                <NavLink to='/fixer-registration' className='nav-link' onClick={() => setUrl(window.location.href)}>Fixers</NavLink>
                            </li>
                        </ul>
                    </HoverNav>
                </li>
            )}
        </ul>
    </nav>
  )
}
export default NavBar;