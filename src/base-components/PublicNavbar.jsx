import { NavLink, Outlet } from "react-router-dom"
import HoverNav from './HoverNav';

const Layout = () => {

  return (
    <div>
        <nav>
            <ul>
                <li>
                    <NavLink to='welcome'>Welcome</NavLink>
                </li>
                <li>
                    <NavLink to='get-started'>Get Started</NavLink>
                </li>
                <li>
                    <HoverNav 
                        title='Login'
                    >
                    <li>
                        <NavLink to='user-login'>Users</NavLink>
                    </li>
                    <li>
                        <NavLink to='fixer-login'>Fixers</NavLink>
                    </li>
                    </HoverNav>
                </li>
                <li>
                    <HoverNav 
                        title='Sign Up'
                    >
                    <li>
                        <NavLink to='user-login'>Users</NavLink>
                    </li>
                    <li>
                        <NavLink to='fixer-login'>Fixers</NavLink>
                    </li>
                    </HoverNav>
                </li>
            </ul>
        </nav>
        <Outlet />
    </div>
  )
}
export default Layout