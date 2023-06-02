import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRequest, geolocationQuery } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';

const CURRENT_URL = '/users/request/current';

const UserHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { data } = useRequest(axiosPrivate, CURRENT_URL);
  const [active, setActive] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth <= 480 ? true : false);
  const [navBreak, setNavBreak] = useState(window.innerWidth <= 650 ? true : false);
  const [tablet, setTablet] = useState(window.innerWidth <= 768 ? true : false);
  const [portrait, setPortrait] = useState(window.innerHeight >= window.innerWidth ? true : false)
  // calculating map height to fill the screen depending on the nav bar's total height (including margin/borders)
  // considering setting a minimum map height (maybe 600-700px for non-mobile screens) so that the interface still looks good if the window is resized smaller
  const [mapHeight, setMapHeight] = useState(window.innerWidth <= 650 ? window.innerHeight - 67.273 : window.innerHeight - 105);

  useEffect(() => {
    (async () => {
      await queryClient.prefetchQuery(geolocationQuery);
    })();
  }, []);

  useEffect(() => {
    if (data?.jobId) {
      setActive(true)
    } else {
      setActive(false);
    }
  }, [data?.jobId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight >= window.innerWidth) {
        setPortrait(true);
      } else {
        setPortrait(false);
      }

      if (window.innerWidth <= 650) {
        if (window.innerWidth <= 480) {
          setMobile(true);
          setTablet(false);
        } else {
          setMobile(false);
          setTablet(true);
        }
        setNavBreak(true);
        setMapHeight(window.innerHeight - 67.273);
      } else if (window.innerWidth <= 768) {
        setNavBreak(false);
        setTablet(true);
        setMobile(false);
        setMapHeight(window.innerHeight - 105);
      } else {
        setNavBreak(false);
        setMobile(false);
        setTablet(false);
        setMapHeight(window.innerHeight - 105);
      }
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div className='user-home'>
      <PrivateNavBar navOptions={{
        homeUrl: '/',
        leftUrl: 'quick-fix',
        leftTitle: active ? 'Active Job' : 'Quick Fix',
        midUrl: 'proposals',
        midTitle: 'Proposals',
        rightUrl: 'schedule',
        rightTitle: 'Schedule',
        navBreak,
      }}/>
      <Outlet context={{active, setActive, mapHeight, mobile, tablet, portrait}}/>
    </div>
  )
}
export default UserHome;