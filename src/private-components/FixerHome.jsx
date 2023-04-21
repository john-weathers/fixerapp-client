import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRequest, geolocationQuery } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';

const CURRENT_URL = '/fixers/work/current';

const FixerHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { data } = useRequest(axiosPrivate, CURRENT_URL);
  const [active, setActive] = useState(false);

  useEffect(() => {
    (async () => {
      await queryClient.prefetchQuery(geolocationQuery);
    })();
  }, [])

  useEffect(() => {
    if (data?.jobId) {
      setActive(true)
    } else {
      setActive(false);
    }
  }, [data?.jobId])

  return (
    <div>
      <PrivateNavBar navOptions={{
        homeUrl: '/fixers',
        leftUrl: 'quick-fix',
        leftTitle: active ? 'Active Job' : 'Quick Fix',
        midUrl: 'bid',
        midTitle: 'Bid',
        rightUrl: 'schedule',
        rightTitle: 'Schedule',
      }}/>
      <Outlet context={[active, setActive]}/>
    </div>
  )
}
export default FixerHome;