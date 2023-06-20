import { useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const EMAIL_REGEX = /^.{1,64}@.{1,255}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]{1,30}$/;
const PHONE_REGEX = /^[\+0-9]{0,4}[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}$/;
const PROFILE_URL = '/fixers/profile';
const UPDATE_PROFILE_URL = '/fixers/update-profile';

// useMutation to post updates to profile, onSuccess invalidate 
const FixerProfile = () => {
  const [emailToggle, setEmailToggle] = useState(false);
  const [phoneToggle, setPhoneToggle] = useState(false);
  const [passwordToggle, setPasswordToggle] = useState(false);
  const [firstToggle, setFirstToggle] = useState(false);
  const [lastToggle, setLastToggle] = useState(false);
  
  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);

  const [newPwd, setNewPwd] = useState('');
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
  const { setAuth } = useAuth();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(newPwd));
    setValidMatch(newPwd === matchPwd);
  }, [newPwd, matchPwd]);

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
  }, [email, phoneNumber, firstName, lastName, newPwd, matchPwd]);

  const handleUpdate = async e => {
    e.preventDefault();
    const data = new FormData(e.target);
    const updateKeys = Object.keys(Object.fromEntries(data));
    if (updateKeys.length > 1) {
      const oldPwd = data.get('oldpwd');
      const newPwd = data.get('newpwd');
      if (!PWD_REGEX.test(oldPwd) || !PWD_REGEX.test(newPwd)) {
        setErrMsg('Invalid Entry');
        errRef.current.focus();
        return;
      } else {
        try {
          await axiosPrivate.patch(UPDATE_PROFILE_URL, {
            updateKey: 'password',
            updateData: {
              oldPwd,
              newPwd,
            },
          });
          setPasswordToggle(false);
        } catch (err) {
          if (!err?.response) {
            setErrMsg('No Server Response');
          } else if (err.response?.status === 400) {
            setErrMsg('Missing data to update password');
          } else if (err.response?.status === 401) {
            setErrMsg('Unauthorized');
          } else {
            setErrMsg('Error updating password');
          }
          errRef.current.focus();
        }
      }
    } else {
      const updateKey = updateKeys?.[0];
      const updateData = data.get(updateKey);
      let testRegex;
      let toggleFunction;
      switch (updateKey) {
        case 'email':
          testRegex = EMAIL_REGEX;
          toggleFunction = setEmailToggle;
          break;
        case 'phoneNumber':
          testRegex = PHONE_REGEX;
          toggleFunction = setPhoneToggle;
          break;
        case 'first':
          testRegex = NAME_REGEX;
          toggleFunction = setFirstToggle;
          break;
        case 'last':
          testRegex = NAME_REGEX;
          toggleFunction = setLastToggle;
          break;
        default:
          return;
      }

      if (!testRegex.test(updateData)) {
        setErrMsg('Invalid Entry');
        errRef.current.focus();
        return;
      }

      let axiosOptions;
      if (updateKey === 'email') {
        axiosOptions = { withCredentials: true }
      } else {
        axiosOptions = {}
      }

      try {
        const response = await axiosPrivate.patch(UPDATE_PROFILE_URL, 
          {
            updateKey,
            updateData: {
              updateData,
              pwd,
            },
          },
          axiosOptions,
        );
        if (updateKey === 'email') {
          const accessToken = response?.data?.accessToken;
          setAuth({ email: updateData, accessToken });
        }
        queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'all' });
        toggleFunction(false);
      } catch (err) {
        if (!err?.response) {
          setErrMsg('No Server Response');
        } else if (err.response?.status === 400) {
          setErrMsg(`Missing data to update ${updateKey}`);
        } else if (err.response?.status === 401) {
          setErrMsg('Unauthorized');
        } else {
          setErrMsg(`Error updating ${updateKey}`);
        }
        errRef.current.focus();
      }
    }
  }

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
            <form onSubmit={handleUpdate}>
              <label htmlFor='new-email'>New email</label>
              <input 
                id='new-email'
                name='email'
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
                  type='password'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => {
                  setEmailToggle(false);
                  setEmail('');
                }} className='btn'>Cancel</button>
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
            <form onSubmit={handleUpdate}>
              <label htmlFor='new-phone'>New phone number</label>
              <input 
                id='new-phone'
                name='phoneNumber'
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
                  type='password'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => {
                  setPhoneToggle(false);
                  setPhoneNumber('');
                }} className='btn'>Cancel</button>
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
            <form onSubmit={handleUpdate}>
              <label htmlFor='new-first'>New first name</label>
              <input 
                id='new-first'
                name='first'
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
                  type='password'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => {
                  setFirstToggle(false);
                  setFirstName('');
                }} className='btn'>Cancel</button>
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
            <form onSubmit={handleUpdate}>
              <label htmlFor='new-last'>New last name</label>
              <input 
                id='new-last'
                name='last'
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
                  type='password'
                  autoComplete='off'
                  onChange={(e) => setPwd(e.target.value)}
                  value={pwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => {
                  setLastToggle(false);
                  setLastName('');
                }} className='btn'>Cancel</button>
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
            <button type='button' onClick={() => {
              setPasswordToggle(prev => !prev);
              setPwd('');
              setNewPwd('');
              setMatchPwd('');
            }} className='destyled-btn'>Change</button>
          ) : (
            <form onSubmit={handleUpdate}>
              <label htmlFor='old-password'>Old password</label>
              <input 
                id='old-password'
                name='oldpwd'
                type='password'
                autoComplete='off'
                onChange={(e) => setPwd(e.target.value)}
                value={pwd}
                required
                className='text-field'
              />
              <label></label>
              <label htmlFor='new-password'>New password</label>
              <input 
                id='new-password'
                name='newpwd'
                type='password'
                autoComplete='off'
                onChange={(e) => setNewPwd(e.target.value)}
                value={newPwd}
                required
                className='text-field'
              />
              <label>
                Confirm your new password
                <input 
                  type='password'
                  autoComplete='off'
                  onChange={(e) => setMatchPwd(e.target.value)}
                  value={matchPwd}
                  required
                  className='text-field'
                />
              </label>
              <div className='btn-div'>
                <button type='button' onClick={() => {
                  setPasswordToggle(false);
                  setPwd('');
                  setNewPwd('');
                  setMatchPwd('');
                }} className='btn'>Cancel</button>
                <button disabled={!validPwd || !validMatch ? true : false} className='btn'>Save</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
export default FixerProfile