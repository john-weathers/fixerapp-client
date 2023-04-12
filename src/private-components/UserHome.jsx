import { Outlet } from 'react-router-dom';
import { useRequest } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';

const CURRENT_URL = '/users/request/current';

const UserHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const { data } = useRequest(axiosPrivate, CURRENT_URL);

  return (
    <div>
      <PrivateNavBar navOptions={{
        homeUrl: '/',
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