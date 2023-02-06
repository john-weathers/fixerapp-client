/*import { useState } from 'react'
import { useLoaderData, useNavigate, useLocation } from 'react-router-dom';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const PROFILE_URL = '/users/profile';
const axiosPrivate = useAxiosPrivate();
const navigate = useNavigate();
const location = useLocation();

export const loader = async () => {
  try {
    const getProfile = await axiosPrivate.get(PROFILE_URL);
    return getProfile;
  } catch (err) {
    console.log(err);
    navigate('/user-login', { state: { from: location }, replace: true });
  }
  
}*/
const UserHome = () => {
  //const profileData = useLoaderData();

  return (
    <div>

    </div>
  )
}
export default UserHome