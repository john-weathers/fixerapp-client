import { NavLink, Outlet } from "react-router-dom"
import { faCircleUser } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverNav from './HoverNav';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { faHammer } from "@fortawesome/free-solid-svg-icons";
import useLogout from "../hooks/useLogout";

const PrivateNavBar = ({ navOptions }) => {
    const logout = useLogout();

    return (
        <nav className='header-private'>
            <ul className='nav-container-private'>
                <li>
                    <NavLink to={navOptions.homeUrl}>
                        <div className='logo'>
                            <FontAwesomeIcon icon={faHammer} className='logo-img'/>
                            <h1 className='logo-part1'>fixer<span className='logo-part2'>app</span></h1>
                        </div>
                    </NavLink>
                </li>
                <li>
                    <NavLink to={navOptions.leftUrl}>{navOptions.leftTitle}</NavLink>
                </li>
                <li>
                    <NavLink to={navOptions.midUrl}>{navOptions.midTitle}</NavLink>
                </li>
                <li>
                    <NavLink to={navOptions.rightUrl}>{navOptions.rightTitle}</NavLink>
                </li>
                <li>
                    <HoverNav title={<FontAwesomeIcon icon={faCircleUser}/>}>
                        <ul>
                            <li>
                                <NavLink to='profile'>Profile</NavLink>
                            </li>
                            <li>
                                <NavLink to='settings'>Settings</NavLink>
                            </li>
                            <li onClick={async () => await logout()} id='logout'>Logout</li>
                        </ul>
                    </HoverNav>
                </li>
            </ul>
        </nav>
  )
}
export default PrivateNavBar;