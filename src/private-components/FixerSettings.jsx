import { useState, useEffect, useRef } from 'react';
import { useProfile } from '../hooks/reactQueryHooks';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useQueryClient } from '@tanstack/react-query';

const PROFILE_URL = '/fixers/profile';
const UPDATE_SETTINGS_URL = '/fixers/update-settings';

const FixerSettings = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);
  const [extended, setExtended] = useState(profileData?.settings?.extendedOptIn);
  const [errMsg, setErrMsg] = useState('');
  const errRef = useRef();

  useEffect(() => {
    setExtended(profileData?.settings?.extendedOptIn);
  }, [isLoading]);

  const handleChange = async e => {
    let previousValue;
    setExtended(prev => {
      previousValue = prev;
      return !prev;
    });
    try {
      await axiosPrivate.patch(UPDATE_SETTINGS_URL, {
        updateKey: e.target.name,
      });
      queryClient.invalidateQueries({ queryKey: ['profile'], refetchType: 'all' });
    } catch (err) {
      setExtended(previousValue);
      if (!err?.response) {
        setErrMsg('No Server Response');
      } else if (err.response?.status === 400) {
        setErrMsg('Missing proper data to update settings');
      } else if (err.response?.status === 401) {
        setErrMsg('Unauthorized');
      } else {
        setErrMsg('Error updating settings');
      }
      errRef.current.focus();
    }
  }

  if (isLoading) return (
    <div className='center'>
      <h2>Fetching settings...</h2>
    </div>
  )

  if (isError) return (
    <div className='center'>
      <h2>Error fetching settings...</h2>
    </div>
  )

  return (
    <div className='settings'>
      <div className={errMsg ? 'errmsg' : 'offscreen'}>
        <FontAwesomeIcon onClick={() => setErrMsg('')} icon={faCircleXmark} aria-label='close error message' className='x-close' size='xl' />
        <p ref={errRef} aria-live='assertive' className='errmsg-p'>{errMsg}</p>
      </div>  
      <h2>Settings</h2>
      <div className='flex-1'>
        <div className='flex-2'>
          <label className='toggle-checkbox'>
            <input 
              id='extended-opt-in'
              name='extendedOptIn'
              type='checkbox'
              checked={extended}
              onChange={handleChange}
              className='toggle-checkbox'
              aria-label='Accept jobs within 40 miles if none are available within 20 (additional compensation is provided for extended range jobs)'
            />
            <span className='toggle'></span>
          </label>
          <p>Accept jobs within 40 miles if none are available within 20 (additional compensation is provided for extended range jobs)</p>
        </div>
      </div>
    </div>
  )
}
export default FixerSettings