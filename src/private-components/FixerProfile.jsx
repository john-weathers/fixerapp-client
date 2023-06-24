import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useProfile } from '../hooks/reactQueryHooks';
import { faCheck, faTimes, faInfoCircle, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import useAuth from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const EMAIL_REGEX = /^.{1,64}@.{1,255}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]{1,30}$/;
const PHONE_REGEX = /^[\+0-9]{0,4}[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}$/;
const PROFILE_URL = '/fixers/profile';
const UPDATE_PROFILE_URL = '/fixers/update-profile';

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
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState('');
  const [validMatch, setValidMatch] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [validFirst, setValidFirst] = useState(false);

  const [lastName, setLastName] = useState('');
  const [validLast, setValidLast] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [validNumber, setValidNumber] = useState(false);

  const [errMsg, setErrMsg] = useState('');
  const { scrollY } = useOutletContext();

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
    <div className='center'>
      <h2>Fetching profile...</h2>
    </div>
  )

  if (isError) return (
    <div className='center'>
      <h2>Error fetching profile...</h2>
    </div>
  )

  return (
    <div className='profile'>
      <div className={errMsg ? 'errmsg' : 'offscreen'} style={{ top: scrollY ? `calc(50% + ${scrollY}px)` : '50%' }}>
          <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
          <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
      </div>  
      <h2>Profile</h2>
      <div className='flex-1'>
        <div>
          <div className={!emailToggle ? 'flex-2' : 'flex-2 toggled'}>
            <h3>{!emailToggle ? 'Email' : 'Change Email'}</h3>
            {!emailToggle ? (
              <button type='button' onClick={() => setEmailToggle(prev => !prev)} className='destyled-btn'>Change</button>
            ) : (
              <form onSubmit={handleUpdate}>
                <label>
                  New email
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
                </label>
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
                  }} className='btn secondary'>Cancel</button>
                  <button disabled={!validEmail || !pwd ? true : false} className='btn'>Save</button>
                </div>
              </form>
            )}
          </div>
          {!emailToggle && <p className='profile-data'>{profileData.email}</p>}
        </div>
        <div>
          <div className={!phoneToggle ? 'flex-2' : 'flex-2 toggled'}>
            <h3>{!phoneToggle ? 'Phone Number' : 'Change Phone Number'}</h3>
            {!phoneToggle ? (
              <button type='button' onClick={() => setPhoneToggle(prev => !prev)} className='destyled-btn'>Change</button>
            ) : (
              <form onSubmit={handleUpdate}>
                <label>
                  New phone number
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
                </label>
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
                  }} className='btn secondary'>Cancel</button>
                  <button disabled={!validNumber || !pwd ? true : false} className='btn'>Save</button>
                </div>
              </form>
            )}
          </div>
          {!phoneToggle && <p className='profile-data'>{profileData.phoneNumber}</p>}
        </div>
        <div>
          <div className={!firstToggle ? 'flex-2' : 'flex-2 toggled'}>
          <h3>{!firstToggle ? 'First Name' : 'Change First Name'}</h3>
          {!firstToggle ? (
              <button type='button' onClick={() => setFirstToggle(prev => !prev)} className='destyled-btn'>Change</button>
            ) : (
              <form onSubmit={handleUpdate}>
                <label>
                  New first name
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
                </label>
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
                  }} className='btn secondary'>Cancel</button>
                  <button disabled={!validFirst || !pwd ? true : false} className='btn'>Save</button>
                </div>
              </form>
            )}
          </div>
          {!firstToggle && <p className='profile-data'>{profileData.firstName}</p>}
        </div>
        <div>
          <div className={!lastToggle ? 'flex-2' : 'flex-2 toggled'}>
            <h3>{!lastToggle ? 'Last Name' : 'Change Last Name'}</h3>
            {!lastToggle ? (
              <button type='button' onClick={() => setLastToggle(prev => !prev)} className='destyled-btn'>Change</button>
            ) : (
              <form onSubmit={handleUpdate}>
                <label>
                  New last name
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
                </label>
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
                  }} className='btn secondary'>Cancel</button>
                  <button disabled={!validLast || !pwd ? true : false} className='btn'>Save</button>
                </div>
              </form>
            )}
          </div>
          {!lastToggle && <p className='profile-data'>{profileData.lastName}</p>}
        </div>
        <div>
          <div className={!passwordToggle ? 'flex-2' : 'flex-2 toggled'}>
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
                <label>
                  Old password
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
                </label>
                <label>
                  New password
                  <FontAwesomeIcon icon={faCheck} className={validPwd ? 'valid' : 'hide'} />
                  <FontAwesomeIcon icon={faTimes} className={validPwd || !newPwd ? 'hide' : 'invalid'} />
                  <input 
                    id='new-password'
                    name='newpwd'
                    type='password'
                    autoComplete='off'
                    onChange={(e) => setNewPwd(e.target.value)}
                    value={newPwd}
                    required
                    className='text-field'
                    aria-invalid={validPwd ? 'false' : 'true'}
                    aria-describedby='pwdnote'
                    onFocus={() => setPwdFocus(true)}
                    onBlur={() => setPwdFocus(false)}
                  />
                </label>
                <p id='pwdnote' className={pwdFocus && !validPwd ? 'instructions' : 'offscreen'}>
                  <FontAwesomeIcon icon={faInfoCircle} />{' '}
                  8 to 24 characters.<br />
                  Must include uppercase and lowercase letters, a number and a special character.<br />
                  Allowed special characters: <span aria-label='exclamation mark'>!</span> <span aria-label='at symbol'>@</span> 
                  <span aria-label='hashtag'>#</span> <span aria-label='dollar sign'>$</span> <span aria-label='percent'>%</span>
                </p>
                <label>
                  Confirm your new password
                  <FontAwesomeIcon icon={faCheck} className={validMatch && matchPwd ? 'valid' : 'hide'} />
                  <FontAwesomeIcon icon={faTimes} className={validMatch || !matchPwd ? 'hide' : 'invalid'} />
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
                  }} className='btn secondary'>Cancel</button>
                  <button disabled={!validPwd || !validMatch ? true : false} className='btn'>Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default FixerProfile