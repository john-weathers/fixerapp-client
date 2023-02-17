import useProfile from '../hooks/useProfile';

const FixerIndex = () => {
  const { profile } = useProfile();

  return (
    <div>
      <h2>Welcome, {profile.firstName}!</h2>
      <p>Select a tab to get started on news jobs or view scheduled work</p>
      <ul>
        <li>Quick Fix to find standard repair jobs immediately</li>
        <li>Compete for more comprehensive jobs in the Bid tab</li>
      </ul>
    </div>
  )
}
export default FixerIndex