import NavBar from '../base-components/PublicNavbar';
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div>
        <NavBar />
        <div>
          <h1>Start Fixing!</h1>
          <Link to='/user-registration'>User sign up</Link>
          <Link to='/fixer-registration'>Fixer sign up</Link>
        </div>
        <div>
          <h2>Professional repair service made easy</h2>
          <ul>
            <li>Get professional help now or schedule at your convenience</li>
            <li>Reliable service and rates without the lengthy search</li>
            <li>No more time wasted playing phone tag</li>
          </ul>
        </div>
        <div>
          <h2>How it works</h2>
          <p>Hire a professional in a few clicks</p>
          <p>Get help now or schedule it for later</p>
          <Link to='/how-it-works'>Check out the app</Link>
        </div>
        <div>
          <p>Repair professional looking for work?</p>
          <Link to='/fixer-registration'>Apply now</Link>
        </div>
    </div>
  )
}
export default Landing