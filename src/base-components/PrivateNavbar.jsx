import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import HoverNav from './HoverNav';
import useLogout from '../hooks/useLogout';

const PrivateNavBar = ({ navOptions }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileHeight, setMobileHeight] = useState(null);
    const logout = useLogout();
    
    useEffect(() => {
    const scrollHeight = document.body.scrollHeight;
    if (window.innerHeight >= scrollHeight) {
        setMobileHeight(window.innerHeight)
    } else {
        setMobileHeight(scrollHeight);
    }
  }, [mobileOpen]);


    const handleMobileClick = () => {
        setMobileOpen(false);
    }

    const handleMobileMenuClick = () => {
        setMobileOpen(prev => !prev)
    }

    const handleUserMenuClick = () => {
        setUserMenuOpen(prev => !prev);
    }

    const handleUMClick = () => {
        setUserMenuOpen(false);
    }

    const handleHomeClick = () => {
        setMobileOpen(false);
        setUserMenuOpen(false);
    }

    return (
        <nav className='header private'>
            <ul className='nav-container'>
                {(navOptions.navBreak) ? (
                    <div className='nav-subcontainer-mobile'>
                        <img src='/menu.svg' onClick={handleMobileMenuClick}/>
                        {mobileOpen && (
                        <ul className='mobile-popout' style={mobileHeight ? { height: mobileHeight } : { height: '100%' }}>
                            <li className='nav-overlay' onClick={handleMobileClick}></li>
                            <li>
                                <NavLink to={navOptions.leftUrl} className='nav-link' onClick={handleMobileClick}>{navOptions.leftTitle}</NavLink>
                            </li>
                            <li>
                                <NavLink to={navOptions.midUrl} className='nav-link' onClick={handleMobileClick}>{navOptions.midTitle}</NavLink>
                            </li>
                            <li>
                                <NavLink to={navOptions.rightUrl} className='nav-link' onClick={handleMobileClick}>{navOptions.rightTitle}</NavLink>
                            </li>
                            <li className='body-overlay' onClick={handleMobileClick}></li>
                        </ul>
                        )}
                        <li className='home'>
                            <NavLink to={navOptions.homeUrl} className='nav-link home' onClick={handleHomeClick}>
                                <img src='/Hammer.svg' className='logo-img' alt='Hammer, credit: https://icons8.com/icon/100418/hammer'/>
                                <h1 className='logo-part1'>fixer<span className='logo-part2'>app</span></h1>
                            </NavLink>
                        </li>
                        <img src='/user.svg' onClick={handleUserMenuClick}/>
                        {userMenuOpen && (
                        <ul className='mobile-popout' style={mobileHeight ? { height: mobileHeight } : { height: '100%' }}>
                            <li className='nav-overlay' onClick={handleUMClick}></li>
                            <li>
                                <NavLink to='profile' className='nav-link' onClick={handleUMClick}>Profile</NavLink>
                            </li>
                            <li>
                                <NavLink to='settings' className='nav-link' onClick={handleUMClick}>Settings</NavLink>
                            </li>
                            <li onClick={async () => await logout()} className='logout'>Logout</li>
                            <li className='body-overlay' onClick={handleUMClick}></li>
                        </ul>    
                        )}
                    </div>
                ) : (
                    <>
                        <li className='home'>
                            <NavLink to={navOptions.homeUrl} className='nav-link home'>
                                    <img src='/Hammer.svg' className='logo-img' alt='Hammer, credit: https://icons8.com/icon/100418/hammer'/>
                                    <h1 className='logo-part1'>fixer<span className='logo-part2'>app</span></h1>
                            </NavLink>
                        </li>
                        <li className='nav-subcontainer'>
                            <NavLink to={navOptions.leftUrl} className='nav-link'>{navOptions.leftTitle}</NavLink>
                            <NavLink to={navOptions.midUrl} className='nav-link'>{navOptions.midTitle}</NavLink>
                            <NavLink to={navOptions.rightUrl} className='nav-link'>{navOptions.rightTitle}</NavLink>
                        </li>
                        <li className='user-menu'>
                            <HoverNav title={<img src='/user.svg'/>}>
                                <ul className='nav-popout'>
                                    <li className='top'>
                                        <NavLink to='profile'>Profile</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to='settings'>Settings</NavLink>
                                    </li>
                                    <li onClick={async () => await logout()} className='logout'>Logout</li>
                                </ul>
                            </HoverNav>
                        </li>
                    </>
                )}
            </ul>
        </nav>
  )
}
export default PrivateNavBar;