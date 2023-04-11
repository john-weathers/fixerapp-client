import { NavLink, Outlet } from "react-router-dom"
import HoverNav from './HoverNav';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const NavBar = () => {

  return (
    <nav>
        <ul>
            <li>
                <NavLink to='/'>
                    <FontAwesomeIcon icon={faHouse} id='home-public'/>
                </NavLink>
            </li>
            <li>
                <NavLink to='/get-started'>Get Started</NavLink>
            </li>
            <li>
                <HoverNav title='Login'>
                <ul>
                    <li>
                        <NavLink to='/user-login'>Users</NavLink>
                    </li>
                    <li>
                        <NavLink to='/fixer-login'>Fixers</NavLink>
                    </li>
                </ul>
                </HoverNav>
            </li>
            <li>
                <HoverNav title='Sign Up'>
                <ul>
                    <li>
                        <NavLink to='/user-registration'>Users</NavLink>
                    </li>
                    <li>
                        <NavLink to='/fixer-registration'>Fixers</NavLink>
                    </li>
                </ul>
                </HoverNav>
            </li>
        </ul>
    </nav>
  )
}
export default NavBar;