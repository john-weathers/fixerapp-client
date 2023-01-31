import { useState } from 'react';
import { NavLink } from "react-router-dom"
import HoverNav from '../base-components/HoverNav';

const Layout = () => {
  const [hover, setHover] = useState(false);


// f/u on setHover function
  return (
    <nav>
      <ul>
          <NavLink to='welcome'>Welcome</NavLink>
          <NavLink to='get-started'>Get Started</NavLink>
          <HoverNav 
            onMouseOver={() => setHover(prev => !prev)}
            onMouseOut={() => setHover(prev => !prev)}
            title='Login'
            hoverStatus={hover} 
          >
              <NavLink to='user-login'>Users</NavLink>
              <NavLink to='fixer-login'>Fixers</NavLink>
          </HoverNav>
          <NavLink to='register'>Sign Up</NavLink>
      </ul>
    </nav>
  )
}
export default Layout