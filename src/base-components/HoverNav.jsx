import { useState } from 'react';

const HoverNav = ({ children, title, active }) => {
    const [hover, setHover] = useState(false);

    return (
        <div 
        onMouseOver={() => setHover(prev => !prev)}
        onMouseOut={() => setHover(prev => !prev)}
        className='hover-nav-parent'
        >
            <div className={active ? 'nav-title-active large' : 'nav-title large'}>
                {title}
            </div>
            {hover &&
            <div className={title === 'Login' ? 'hover-nav-child-1' : 'hover-nav-child-2 other-hover-nav'}>
                {children}
            </div>
            }
        </div>
    )
}
export default HoverNav