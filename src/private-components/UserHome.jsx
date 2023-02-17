import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchProfile, prefetchGeolocation } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import PrivateNavBar from '../base-components/PrivateNavbar';

const PROFILE_URL = '/users/profile';

const UserHome = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  prefetchProfile(queryClient, axiosPrivate, PROFILE_URL);
  prefetchGeolocation(queryClient);

  /*
  const { profile, setProfile } = useProfile();
  const profileResult = useQuery(profileQuery(axiosPrivate));
  const geolocationResult = useQuery(geolocationQuery);

  useEffect(() => {
    if (profileResult.status === 'success') {
      setProfile(prev => {
        return {
          ...prev,
          ...profileResult.data,
        }
      });
    }
  }, [profileResult.status])

  useEffect(() => {
    if (geolocationResult.status === 'success') {
      setProfile(prev => {
        return {
          ...prev,
          currentLocation: [geolocationResult.data.longitude, geolocationResult.data.latitude],
        }
      });
    } else if (geolocationResult.status === 'error') {
      setProfile(prev => {
        return {
          ...prev,
          currentLocation: null,
        }
      })
    }
  }, [geolocationResult.status])

  if (profileResult.isLoading) {
    return <div>Loading...</div>
  }

  if (profileResult.isError) {
    return <div>Error: {error.message}</div>
  }
  */


  return (
    <div>
      <PrivateNavBar navOptions={{
        leftUrl: 'quick-fix',
        leftTitle: 'Quick Fix',
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