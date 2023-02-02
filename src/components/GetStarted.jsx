import { useState } from 'react';

// css cover image for each (vertical split for large screens), display=none for opposite onclick...button at bottom to see opposite
const GetStarted = () => {
  const [userDisplay, setUserDisplay] = useState(true);
  const [fixerDisplay, setFixerDisplay] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showFixerInfo, setShowFixerInfo] = useState(false);

  const handleUserClick = () => {
    setFixerDisplay(prev => !prev);
    if (userDisplay && !fixerDisplay) setShowUserInfo(true);
  }

  const handleFixerClick = () => {
    setUserDisplay(prev => !prev);
    if (fixerDisplay && !userDisplay) setShowFixerInfo(true);
  }

  const handleUserClick2 = () => {
    setUserDisplay(prev => !prev);
    setShowUserInfo(prev => !prev);
    setFixerDisplay(prev => !prev);
    setShowFixerInfo(prev => !prev);
  }

  const handleFixerClick2 = () => {
    setFixerDisplay(prev => !prev);
    setShowFixerInfo(prev => !prev);
    setUserDisplay(prev => !prev);
    setShowUserInfo(prev => !prev);
  }
  
  return (
    <div>
        <div className={userDisplay ? 'userInfoOn' : 'userInfoOff'}>
          {!showUserInfo 
            ? <button type='button' onClick={handleUserClick}>Learn about the user process</button>
            : <div className='moreUserInfo'>
                <h2>With a few clicks you can start hiring repair professionals</h2>
                <h2>Here's how it works</h2>
                <p>Filler text...</p>
                <p>Interested in being a Fixer?</p>
                <button type='button' onClick={handleUserClick2}>Learn more</button>
              </div>
          }
        </div>
        <div className={fixerDisplay ? 'fixerInfoOn' : 'fixerInfoOff'}>
        {!showFixerInfo 
            ? <button type='button' onClick={handleFixerClick}>Learn about the fixer process</button>
            : <div className='moreFixerInfo'>
                <h2>Want to start fixing and earning money? Read on!</h2>
                <h2>The first step is signing up and submitting an application</h2>
                <p>Filler text...</p>
                <p>Interested in learning about the user process?</p>
                <button type='button' onClick={handleFixerClick2}>Learn more</button>
              </div>
          }
        </div>
    </div>
  )
}
export default GetStarted