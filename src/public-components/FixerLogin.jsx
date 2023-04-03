import { useRef, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useInput from '../hooks/useInput';
import useToggle from '../hooks/useToggle';
import axios from '../api/axios';

const LOGIN_URL = '/fixer/auth';

const FixerLogin = () => {
  const { setAuth } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const userRef = useRef();
  const errRef = useRef();

  const [email, resetEmail, emailAttribs] = useInput('email', '');
  const [pwd, setPwd] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [check, toggleCheck] = useToggle('persist', false);
  localStorage.setItem('userType', JSON.stringify('fixer'));

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [email, pwd]);

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
        resetEmail();
        setPwd('');
        navigate(from, { replace: true });
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

  return (
    <div id='login'>
      <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live='assertive'>{errMsg}</p>
      <h1>Fixer Sign In</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor='useremail'>Email Address:</label>
        <input
          type='text'
          id='useremail'
          ref={userRef}
          autoComplete='off'
          {...emailAttribs}
          required
        />

        <label htmlFor='password'>Password:</label>
        <input
          type='password'
          id='password'
          onChange={(e) => setPwd(e.target.value)}
          value={pwd}
          required
        />
        <button>Sign In</button>
        <p>Trust this device?</p>
        <div className='persistCheck'>
          <input
            type='checkbox'
            id='persist'
            onChange={toggleCheck}
            checked={check}
          />
          <label htmlFor='persist'>Click to stay logged in</label>
        </div>
      </form>
      <p>
          Need an Account?<br />
          <span className='needAccount'>
            <Link to='/fixer-registration'>Sign Up</Link>
          </span>
      </p>
    </div>
  )
}

export default FixerLogin;