import { useProfile } from '../hooks/reactQueryHooks';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const PROFILE_URL = '/fixers/profile';

const FixerIndex = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);

  return (
    <div>
      {isLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
      <p>Select a tab to get started on news jobs or view scheduled work</p>
      <ul>
        <li>Quick Fix to find standard repair jobs immediately</li>
        <li>Compete for more comprehensive jobs in the Bid tab</li>
      </ul>
    </div>
  )
}
export default FixerIndex