import useProfile from '../hooks/useProfile';

const FixerIndex = () => {
  const { profile } = useProfile();

  return (
    <div>
      <h2>Welcome, {profile.firstName}!</h2>
      <p>Select a tab to get started on a new repair request or view already scheduled jobs</p>
      <ul>
        <li>Quick Fix for immediate help on smaller jobs</li>
        <li>Proposals to seek help on jobs of any size</li>
      </ul>
    </div>
  )
}
export default FixerIndex