import { NavLink, Outlet } from "react-router-dom"
import HoverNav from './HoverNav';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHammer } from "@fortawesome/free-solid-svg-icons";

const NavBar = ({ onClick }) => {

  return (
    <nav id='header-public'>
        <ul className='nav-container'>
            <li>
                <NavLink to='/' className='nav-link'>
                        <FontAwesomeIcon icon={faHammer} className='logo-img'/>
                        <h1 className='logo-part1'>fixer<span className='logo-part2'>app</span></h1>
                </NavLink>
            </li>
            <li>
                <NavLink to='/get-started' onClick={onClick} className='nav-link'>Learn More</NavLink>
            </li>
            <li>
                <HoverNav title='Login'>
                <ul>
                    <li>
                        <NavLink to='/user-login' className='nav-link'>Clients</NavLink>
                    </li>
                    <li>
                        <NavLink to='/fixer-login' className='nav-link'>Fixers</NavLink>
                    </li>
                </ul>
                </HoverNav>
            </li>
            <li>
                <HoverNav title='Sign Up'>
                    <ul>
                        <li>
                            <NavLink to='/user-registration' className='nav-link'>Clients</NavLink>
                        </li>
                        <li>
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