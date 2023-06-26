import { useRef, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { faCircleXmark, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useInput from '../hooks/useInput';
import useToggle from '../hooks/useToggle';
import NavBar from '../base-components/PublicNavbar';
import axios from '../api/axios';

const LOGIN_URL = '/user/auth';

const UserLogin = () => {
  const { auth, setAuth } = useAuth();

  const [mobile, setMobile] = useState(window.innerWidth <= 480 ? true : false);

  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const userRef = useRef();
  const errRef = useRef();

  const [email, resetEmail, emailAttribs] = useInput('email', '');
  const [pwd, setPwd] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [check, toggleCheck] = useToggle('persist', false);
  const [loading, setLoading] = useState(false);
  localStorage.setItem('userType', JSON.stringify('user'));

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [email, pwd]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 480) {
        setMobile(true);
      } else {
        setMobile(false);
      }
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const response = await axios.post(LOGIN_URL,
          { email, pwd },
          {
            withCredentials: true,
          },
        );
        const accessToken = response?.data?.accessToken;
        
        setAuth({ email, accessToken });
        setLoading(true);
    } catch (err) {
        if (!err?.response) {
            setErrMsg('No Server Response');
        } else if (err.response?.status === 400) {
            setErrMsg('Missing Username or Password');
        } else if (err.response?.status === 401) {
            setErrMsg('Unauthorized');
        } else {
            setErrMsg('Login Failed');
        }
        errRef.current.focus();
    }
}

  if (auth?.accessToken) return <Navigate to={from} replace={true} />

  if (loading) return (
    <div className='loading'>
      <FontAwesomeIcon icon={faSpinner} spin size='3x'/>
    </div>
  )

  return (
    <>
      {!auth?.accessToken ? (
        <div className='login'>
          <NavBar />
          <div className={errMsg ? 'errmsg' : 'offscreen'}>
            <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
            <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
          </div>    
          {mobile ? (
            <h1 className='title-mobile'>Client login</h1>
          ) : (
            <h1 className='app-name-part1'>fixer<span className='app-name-part2'>app</span><span className='title-divider'> | </span><span className='title-part3'>client login</span></h1>
          )}
          <form onSubmit={handleSubmit} className='account-form'>
            <label htmlFor='useremail' className='text-label'>Email Address</label>
            <input
              type='text'
              id='useremail'
              ref={userRef}
              autoComplete='off'
              {...emailAttribs}
              required
              className='text-field'
            />

            <label htmlFor='password' className='text-label'>Password</label>
            <input
              type='password'
              id='password'
              onChange={(e) => setPwd(e.target.value)}
              value={pwd}
              required
              className='text-field'
            />
            
            <label htmlFor='persist' className='persist-label'>
              <input
                type='checkbox'
                id='persist'
                onChange={toggleCheck}
                checked={check}
              />
              Keep me signed in
            </label>
            <button className='btn'>Login</button>
          </form>
          <p className='account-p'>Need an account? <Link to='/user-registration' className='account-span'>Sign up here</Link></p>
        </div>
      ) : (
        <Navigate to={from} replace={true} />
      )}
    </>
  )
}

export default UserLogin;