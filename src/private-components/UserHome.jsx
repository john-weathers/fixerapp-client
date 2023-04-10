import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchProfile, prefetchGeolocation, useRequest } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';
import axios from '../api/axios';

const PROFILE_URL = '/users/profile';
const CURRENT_URL = '/users/request/current';

// NOTE: source of multiple calls to refresh could be combination of page refresh (PersistLogin) and axiosPrivate call to refresh
// it would make sense that this could happen when refreshing and a protected route is also invoked
// depending on timing of everything, could be causing errors

const UserHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { data } = useRequest(axiosPrivate, CURRENT_URL);

  // prefetchProfile(queryClient, axiosPrivate, PROFILE_URL);
  prefetchGeolocation(queryClient);

  return (
    <div>
      <PrivateNavBar navOptions={{
        leftUrl: 'quick-fix',
        leftTitle: data ? 'Active Job' : 'Quick Fix',
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