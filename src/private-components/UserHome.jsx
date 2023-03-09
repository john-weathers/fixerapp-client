import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchProfile, prefetchGeolocation, useRequest } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';

const PROFILE_URL = '/users/profile';
const CURRENT_URL = '/users/request/current';

const UserHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { isLoading, isSuccess } = useRequest(axiosPrivate, CURRENT_URL);

  prefetchProfile(queryClient, axiosPrivate, PROFILE_URL);
  prefetchGeolocation(queryClient);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <PrivateNavBar navOptions={{
        leftUrl: isSuccess ? 'confirmation' : 'quick-fix',
        leftTitle: isSuccess ? 'Active Job' : 'Quick Fix',
        midUrl: 'proposals',
        midTitle: 'Proposals',
        rightUrl: 'schedule',
        rightTitle: 'Schedule',
      }}/>
      <Outlet />
    </div>
  )
}
export default UserHome;