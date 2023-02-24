import { useProfile } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const PROFILE_URL = '/users/profile';

const UserIndex = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);

  return (
    <div>
      {isLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
      <p>Select a tab to get started on a new repair request or view already scheduled jobs</p>
      <ul>
        <li>Quick Fix for immediate help on smaller jobs</li>
        <li>Proposals to seek help on jobs of any size</li>
      </ul>
    </div>
  )
}
export default UserIndex