import { useState } from 'react';

const HoverNav = ({ children, title }) => {
    const [hover, setHover] = useState(false);

    return (
        <div 
        onMouseOver={() => setHover(prev => !prev)}
        onMouseOut={() => setHover(prev => !prev)}
        >
            <div className='nav-title'>{title}</div>
            {hover &&
            <div>
                {children}
            </div>
            }
        </div>
    )
}
export default HoverNav