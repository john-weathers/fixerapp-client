import { useProfile } from '../hooks/reactQueryHooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

const PROFILE_URL = '/fixers/profile';

const FixerIndex = () => {
  const axiosPrivate = useAxiosPrivate();
  const { isLoading, isError, data: profileData } = useProfile(axiosPrivate, PROFILE_URL);

  return (
    <div className='index'>
        {isLoading || isError ? <h2>Welcome</h2> : <h2>Welcome {profileData.firstName}</h2>}
        <div>
          <p>Select a tab to get started on new jobs or view scheduled work</p>
          <table>
            <tr>
              <td className='icon'><FontAwesomeIcon icon={faScrewdriverWrench} size='lg'/></td>
              <td className='description'>Quick Fix to find standard repair jobs immediately</td>
            </tr>
            <tr>
              <td className='icon'><FontAwesomeIcon icon={faFileInvoiceDollar} size='lg'/></td>
              <td className='description'>Compete for more comprehensive jobs in the Bid tab</td>
            </tr>
            <tr>
              <td className='icon'><FontAwesomeIcon icon={faCalendar} size='lg'/></td>
              <td className='description'>Schedule to see upcoming jobs you've won</td>
            </tr>
          </table>
        </div>
    </div>
  )
}
export default FixerIndex