import { useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';

const EMAIL_REGEX = /^.{1,64}@.{1,255}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]{1,30}$/;
const PHONE_REGEX = /^[\+0-9]{0,4}[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}$/;
const PROFILE_URL = '/fixers/profile';

// useMutation to post updates to profile, onSuccess invalidate 
const FixerProfile = () => {
  const [emailToggle, setEmailToggle] = useState(false);
  const [phoneToggle, setPhoneToggle] = useState(false);
  const [passwordToggle, setPasswordToggle] = useState(false);
  const [firstToggle, setFirstToggle] = useState(false);
  const [lastToggle, setLastToggle] = useState(false);
  
  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);

  const [pwd, setPwd] = useState('');
  const [validPwd, setValidPwd] = useState(false);

  const [matchPwd, setMatchPwd] = useState('');
  const [validMatch, setValidMatch] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [validFirst, setValidFirst] = useState(false);

  const [lastName, setLastName] = useState('');
  const [validLast, setValidLast] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [validNumber, setValidNumber] = useState(false);

  const [errMsg, setErrMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const errRef = useRef();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setValidFirst(NAME_REGEX.test(firstName));
  }, [firstName]);

  useEffect(() => {
    setValidLast(NAME_REGEX.test(lastName));
  }, [lastName]);

  useEffect(() => {
    setValidNumber(PHONE_REGEX.test(phoneNumber));
  }, [phoneNumber]);

  useEffect(() => {
    setErrMsg('');
  }, [email, pwd, matchPwd]);

  /*const handleNewEmail = e => {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email)) {
      setErrMsg('Invalid Entry');
      errRef.current.focus();
    }
  }

  const handleNewPhone = e => {
    e.preventDefault();
    
    if (!PHONE_REGEX.test(phoneNumber)) {
      setErrMsg('Invalid Entry');
      errRef.current.focus();
    }
  }

  const handleNewFirst = e => {
    e.preventDefault();
    
    if (!NAME_REGEX.test(firstName)) {
      setErrMsg('Invalid Entry');
      errRef.current.focus();
    }
  }

  const handleNewLast = e => {
    e.preventDefault();
    
    if (!NAME_REGEX.test(lastName)) {
      setErrMsg('Invalid Entry');
      errRef.current.focus();
    }
  }

  const handleNewPassword = e => {
    e.preventDefault();
    
    if (!PWD_REGEX.test(pwd)) {
      setErrMsg('Invalid Entry');
      errRef.current.focus();
    }
  }*/

  

  if (isLoading) return (
    <div>
      <h2>Fetching profile...</h2>
    </div>
  )

  if (isError) return (
    <div>
      <h2>Error fetching profile...</h2>
    </div>
  )

  return (
    <div className='profile'>
      <h2>Profile Info</h2>
      <div className='flex-1'>
        <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live='assertive'>{errMsg}</p>
        <div className='flex-2'>
          <h3>{!emailToggle ? 'Email' : 'Change Email'}</h3>
          {!emailToggle ? (
            <button type='button' onClick={() => setEmailToggle(prev => !prev)} className='destyled-btn'>Change</button>
          ) : (
            <form onSubmit={handleNewEmail}>
              <label htmlFor='new-email'>New email</label>
              <input 
                id='new-email'
                type='text'
                autoComplete='off'
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
                className='text-field'
              />
              <label>
                Confirm your password
                <input 
                  type='text'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => setEmailToggle(false)} className='btn'>Cancel</button>
                <button disabled={!validEmail ? true : false} className='btn'>Save</button>
              </div>
            </form>
          )}
        </div>
        <p>{profileData.email}</p>
      </div>
      <div className='flex-1'>
        <div className='flex-2'>
          <h3>{!phoneToggle ? 'Phone Number' : 'Change Phone Number'}</h3>
          {!phoneToggle ? (
            <button type='button' onClick={() => setPhoneToggle(prev => !prev)} className='destyled-btn'>Change</button>
          ) : (
            <form onSubmit={handleNewPhone}>
              <label htmlFor='new-phone'>New phone number</label>
              <input 
                id='new-phone'
                type='text'
                autoComplete='off'
                onChange={(e) => setPhoneNumber(e.target.value)}
                value={phoneNumber}
                required
                className='text-field'
              />
              <label>
                Confirm your password
                <input 
                  type='text'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => setPhoneToggle(false)} className='btn'>Cancel</button>
                <button disabled={!validNumber ? true : false} className='btn'>Save</button>
              </div>
            </form>
          )}
        </div>
        <p>{profileData.phoneNumber}</p>
      </div>
      <div className='flex-1'>
        <div className='flex-2'>
        <h3>{!firstToggle ? 'First Name' : 'Change First Name'}</h3>
        {!firstToggle ? (
            <button type='button' onClick={() => setFirstToggle(prev => !prev)} className='destyled-btn'>Change</button>
          ) : (
            <form onSubmit={handleNewFirst}>
              <label htmlFor='new-first'>New first name</label>
              <input 
                id='new-first'
                type='text'
                autoComplete='off'
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
                required
                className='text-field'
              />
              <label>
                Confirm your password
                <input 
                  type='text'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => setFirstToggle(false)} className='btn'>Cancel</button>
                <button disabled={!validFirst ? true : false} className='btn'>Save</button>
              </div>
            </form>
          )}
        </div>
        <p>{profileData.firstName}</p>
      </div>
      <div className='flex-1'>
        <div className='flex-2'>
          <h3>{!lastToggle ? 'Last Name' : 'Change Last Name'}</h3>
          {!lastToggle ? (
            <button type='button' onClick={() => setLastToggle(prev => !prev)} className='destyled-btn'>Change</button>
          ) : (
            <form onSubmit={handleNewLast}>
              <label htmlFor='new-last'>New last name</label>
              <input 
                id='new-last'
                type='text'
                autoComplete='off'
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
                required
                className='text-field'
              />
              <label>
                Confirm your password
                <input 
                  type='text'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => setLastToggle(false)} className='btn'>Cancel</button>
                <button disabled={!validLast ? true : false} className='btn'>Save</button>
              </div>
            </form>
          )}
        </div>
        <p>{profileData.lastName}</p>
      </div>
      <div className='flex-1'>
        <div className='flex-2'>
          <h3>{!passwordToggle ? 'Password' : 'Change Password'}</h3>
          {!passwordToggle ? (
            <button type='button' onClick={() => setPasswordToggle(prev => !prev)} className='destyled-btn'>Change</button>
          ) : (
            <form onSubmit={handleNewPassword}>
              <label htmlFor='new-password'>New password</label>
              <input 
                id='new-password'
                type='text'
                autoComplete='off'
                onChange={(e) => setPwd(e.target.value)}
                value={pwd}
                required
                className='text-field'
              />
              <label>
                Confirm your password
                <input 
                  type='text'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => setPasswordToggle(false)} className='btn'>Cancel</button>
                <button disabled={!validPwd ? true : false} className='btn'>Save</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
export default FixerProfile