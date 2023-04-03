import { NavLink, Outlet } from "react-router-dom"
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HoverNav from './HoverNav';
import useLogout from "../hooks/useLogout";

const PrivateNavBar = ({ navOptions }) => {
    // const logout = useLogout();

  return (
    <nav>
        <ul>
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
                <HoverNav title={<FontAwesomeIcon icon={faUser}/>}>
                <ul>
                    <li>
                        <NavLink to='profile'>Profile</NavLink>
                    </li>
                    <li>
                        <NavLink to='settings'>Settings</NavLink>
                    </li>
                </ul>
                </HoverNav>
            </li>
        </ul>
    </nav>
  )
}
export default PrivateNavBar;