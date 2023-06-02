import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';

const UserSettings = () => {
  return (
    <div className='under-construction'>
      <FontAwesomeIcon icon={faPersonDigging} size='2xl' flip className='construction-icon'/>
      under construction
      <FontAwesomeIcon icon={faPersonDigging} size='2xl' transform='flip-h' flip className='construction-icon'/>
    </div>
  )
}
export default UserSettings