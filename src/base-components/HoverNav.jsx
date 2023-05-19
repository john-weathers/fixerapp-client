import { useState } from 'react';

const HoverNav = ({ children, title, url }) => {
    const [hover, setHover] = useState(false);

    // main div parent for positioning purposes (position: relative)
    // child div (position: absolute)
    // ul flexbox container
    // if this is too clumsy, can remove some elements (ul maybe) and have the div below as the flexbox container to the NavLink components
    return (
        <div 
        onMouseOver={() => setHover(prev => !prev)}
        onMouseOut={() => setHover(prev => !prev)}
        className='hover-nav-parent'
        >
            <div className={url?.includes('/user-login') || url?.includes('/fixer-login') ? 'nav-title-active' : 'nav-title'}>{title}</div>
            {hover &&
            <div className={title === 'Login' ? 'hover-nav-child-1' : 'hover-nav-child-2'}>
                {children}
            </div>
            }
        </div>
    )
}
export default HoverNav