import { Outlet } from 'react-router-dom';
import { useRequest } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';

const CURRENT_URL = '/fixers/work/current';

const FixerHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const { data } = useRequest(axiosPrivate, CURRENT_URL);

  return (
    <div>
      <PrivateNavBar navOptions={{
        homeUrl: '/fixers',
        leftUrl: 'quick-fix',
        leftTitle: data ? 'Active Job' : 'Quick Fix',
        midUrl: 'bid',
        midTitle: 'Bid',
        rightUrl: 'schedule',
        rightTitle: 'Schedule',
      }}/>
      <Outlet />
    </div>
  )
}
export default FixerHome;