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
  const [mobile, setMobile] = useState(window.innerWidth <= 480 ? true : false);
  const [navBreak, setNavBreak] = useState(window.innerWidth <= 650 ? true : false);
  const [tablet, setTablet] = useState(window.innerWidth <= 768 ? true : false);
  const [portrait, setPortrait] = useState(window.innerHeight >= window.innerWidth ? true : false);
  const [mapHeight, setMapHeight] = useState(window.innerWidth <= 650 ? window.innerHeight - 67.273 : window.innerHeight - 105);
  const [scrollY, setScrollY] = useState(0);

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

    const handleScroll = () => {
      setScrollY(window.scrollY);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    }
  }, []);

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
        navBreak,
      }}/>
      <Outlet context={{ active, setActive, mapHeight, mobile, tablet, portrait, scrollY }}/>
    </div>
  )
}
export default FixerHome;