import { useProfile } from '../hooks/reactQueryHooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faPenToSquare } from '@fortawesome/free-regular-svg-icons';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const PROFILE_URL = '/users/profile';

const UserIndex = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);

  return (
    <div className='index'>
        {isLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
        <div>
          <p>Select a tab to get started on a new repair request or view already scheduled jobs</p>
          <table>
            <tbody>
              <tr>
                <td className='icon'><FontAwesomeIcon icon={faScrewdriverWrench} size='lg'/></td>
                <td className='description'>Quick Fix for immediate help on smaller jobs</td>
              </tr>
              <tr>
                <td className='icon'><FontAwesomeIcon icon={faPenToSquare} size='lg'/></td>
                <td className='description'>Proposals to seek help on jobs of any size</td>
              </tr>
              <tr>
                <td className='icon'><FontAwesomeIcon icon={faCalendar} size='lg'/></td>
                <td className='description'>Schedule to see upcoming jobs you've booked</td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  )
}
export default UserIndex

          