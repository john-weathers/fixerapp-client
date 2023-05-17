import { useRef, useState, useEffect } from 'react';
import { faCheck, faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NavBar from '../base-components/PublicNavbar';
import axios from '../api/axios';
import { Link } from 'react-router-dom';

const EMAIL_REGEX = /^.{1,64}@.{1,255}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]{1,30}$/;
const PHONE_REGEX = /^[\+0-9]{0,4}[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}$/;
const REGISTER_URL = '/user/register';

// ENSURE ALL CONSOLE.LOGS ARE REMOVED PRIOR TO PRODUCTION

const UserRegistration = () => {
  const userRef = useRef();
  const errRef = useRef();

  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const [pwd, setPwd] = useState('');
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const [matchPwd, setMatchPwd] = useState('');
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [validFirst, setValidFirst] = useState(false);
  const [firstFocus, setFirstFocus] = useState(false);

  const [lastName, setLastName] = useState('');
  const [validLast, setValidLast] = useState(false);
  const [lastFocus, setLastFocus] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [validNumber, setValidNumber] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);

  const [errMsg, setErrMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    userRef.current.focus();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const v1 = EMAIL_REGEX.test(email);
    const v2 = PWD_REGEX.test(pwd);
    const v3 = NAME_REGEX.test(firstName);
    const v4 = NAME_REGEX.test(lastName);
    const v5 = PHONE_REGEX.test(phoneNumber);

    if (!v1 || !v2 || !v3 || !v4 || !v5) {
      setErrMsg('Invalid Entry');
      errRef.current.focus();
      return;
    }

    try {
      const response = await axios.post(REGISTER_URL,
        {
          email,
          pwd,
          firstName,
          lastName,
          phoneNumber
        },
        {
          withCredentials: true,
        },
      );
      
      console.log(response?.data); // remove console.log before production
      setSuccess(true);
      setEmail('');
      setPwd('');
      setMatchPwd('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
    } catch (err) {
      if (!err?.response) {
        setErrMsg('No Server Response');
      } else if (err.response?.status === 409) {
        setErrMsg('Email Taken');
      } else if (err.response?.status === 400) {
        setErrMsg('Complete all fields as instructed');
      } else {
        setErrMsg('Registration Failed');
      }
      errRef.current.focus();
    }
  }

  return (
    <>
      {success ? (
        <section>
          <h1>Success!</h1>
          <Link to='/user-login'>Sign In</Link>
        </section>
      ) : (
        <section id='registration'>
          <NavBar />
          <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live='assertive'>{errMsg}</p>
          <h1 className='part1'>fixer<span className='part2'>app</span></h1>
          <form onSubmit={handleSubmit}>
            <label htmlFor='useremail'>
              Email Address
              {
                /*<FontAwesomeIcon icon={faCheck} className={validEmail ? 'valid' : 'hide'} />
                <FontAwesomeIcon icon={faTimes} className={validEmail || !email ? 'hide' : 'invalid'} />*/
              }
            </label>
            <input
              type='text'
              id='useremail'
              ref={userRef}
              autoComplete='off'
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              aria-invalid={validEmail ? 'false' : 'true'}
              aria-describedby='uidnote'
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
            />
            {
              /*<p id='uidnote' className={emailFocus && email && !validEmail ? 'instructions' : 'offscreen'}>
              <FontAwesomeIcon icon={faInfoCircle} />
              Enter a valid email address.
              </p>*/
            }


            <label htmlFor='password'>
              Password
              <FontAwesomeIcon icon={faCheck} className={validPwd ? 'valid' : 'hide'} />
              <FontAwesomeIcon icon={faTimes} className={validPwd || !pwd ? 'hide' : 'invalid'} />
            </label>
            <input
              type='password'
              id='password'
              onChange={(e) => setPwd(e.target.value)}
              value={pwd}
              required
              aria-invalid={validPwd ? 'false' : 'true'}
              aria-describedby='pwdnote'
              onFocus={() => setPwdFocus(true)}
              onBlur={() => setPwdFocus(false)}
            />
            <p id='pwdnote' className={pwdFocus && !validPwd ? 'instructions' : 'offscreen'}>
              <FontAwesomeIcon icon={faInfoCircle} />
              8 to 24 characters.<br />
              Must include uppercase and lowercase letters, a number and a special character.<br />
              Allowed special characters: <span aria-label='exclamation mark'>!</span> <span aria-label='at symbol'>@</span> 
              <span aria-label='hashtag'>#</span> <span aria-label='dollar sign'>$</span> <span aria-label='percent'>%</span>
            </p>


            <label htmlFor='confirm_pwd'>
              Confirm Password
              <FontAwesomeIcon icon={faCheck} className={validMatch && matchPwd ? 'valid' : 'hide'} />
              <FontAwesomeIcon icon={faTimes} className={validMatch || !matchPwd ? 'hide' : 'invalid'} />
            </label>
            <input
              type='password'
              id='confirm_pwd'
              onChange={(e) => setMatchPwd(e.target.value)}
              value={matchPwd}
              required
              aria-invalid={validMatch ? 'false' : 'true'}
              aria-describedby='confirmnote'
              onFocus={() => setMatchFocus(true)}
              onBlur={() => setMatchFocus(false)}
            />
            <p id='confirmnote' className={matchFocus && !validMatch ? 'instructions' : 'offscreen'}>
              <FontAwesomeIcon icon={faInfoCircle} />
              Must match the first password input field.
            </p>


            <label htmlFor='first_name'>
              First Name
            </label>
            <input
              type='text'
              id='first_name'
              onChange={(e) => setFirstName(e.target.value)}
              value={firstName}
              required
              aria-invalid={validFirst ? 'false' : 'true'}
              aria-describedby='firstnamenote'
              onFocus={() => setFirstFocus(true)}
              onBlur={() => setFirstFocus(false)}
            />


            <label htmlFor='last_name'>
              Last Name
            </label>
            <input
              type='text'
              id='last_name'
              onChange={(e) => setLastName(e.target.value)}
              value={lastName}
              required
              aria-invalid={validLast ? 'false' : 'true'}
              aria-describedby='lastnamenote'
              onFocus={() => setLastFocus(true)}
              onBlur={() => setLastFocus(false)}
            />


            <label htmlFor='phone_number'>
              Phone Number
            </label>
            <input
              type='text'
              id='phone_number'
              onChange={(e) => setPhoneNumber(e.target.value)}
              value={phoneNumber}
              required
              aria-invalid={validNumber ? 'false' : 'true'}
              aria-describedby='phonenumbernote'
              onFocus={() => setPhoneFocus(true)}
              onBlur={() => setPhoneFocus(false)}
            />

            <button disabled={!validEmail || !validPwd || !validMatch || !validFirst || !validLast || !validNumber ? true : false}>Sign up</button>
          </form>
          <p>Already have an account? <Link to='/user-login'>Sign in here</Link></p>
        </section>
      )}
    </>
  )

}

export default UserRegistration;