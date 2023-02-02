import { useRef, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { Link, Form, useNavigate, useLocation, useActionData } from 'react-router-dom';
import useToggle from '../hooks/useToggle';
import axios from '../api/axios';

const LOGIN_URL = '/fixerAuth';

// action function for form submission
// use React Router Form component
// useNavigation for optimistic ui?
// set usertype in local storage

export const action = async ({ request }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { setAuth } = useAuth();

  try {
    const formData = await request.formData();
    const email = formData.get('email');
    const pwd = formData.get('pwd');


    const response = await axios.post(LOGIN_URL,
      { email, pwd },
      {
        withCredentials: true,
      },
    );
    const accessToken = response?.data?.accessToken;
    
    setAuth({ email, accessToken });
    navigate(from, { replace: true });
  } catch (err) {
    if (!err?.response) {
      return 'No Server Response';
    } else if (err.response?.status === 400) {
      return 'Missing Username or Password';
    } else if (err.response?.status === 401) {
      return 'Unauthorized';
    } else {
      return 'Login Failed';
    }
  }
}

const FixerLogin = () => {
  const userRef = useRef();
  const errRef = useRef();

  const [errMsg, setErrMsg] = useState('');
  setErrMsg(useActionData() || '');
  if (errMsg) errRef.current.focus();

  
  const [check, toggleCheck] = useToggle('persist', false);
  localStorage.setItem('userType', 'fixer');

  useEffect(() => {
    userRef.current.focus();
  }, []);

  return (
    <div id='login'>
      <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live='assertive'>{errMsg}</p>
      <h1>Fixer Sign In</h1>
      <Form method='post'>
        <label htmlFor='username'>Email:</label>
        <input
          type='text'
          id='username'
          ref={userRef}
          autoComplete='off'
          name='email'
          onChange={() => setErrMsg('')}
          required
        />

        <label htmlFor='password'>Password:</label>
        <input
          type='password'
          id='password'
          name='pwd'
          onChange={() => setErrMsg('')}
          required
        />
        <button type='submit'>Sign In</button>
        <div className='persistCheck'>
          <input
            type='checkbox'
            id='persist'
            onChange={toggleCheck}
            checked={check}
          />
          <label htmlFor='persist'>Trust This Device?<br/>Click to Stay Logged In</label>
        </div>
      </Form>
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