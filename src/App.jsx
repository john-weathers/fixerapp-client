import { Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorPage from './components/ErrorPage';
import Missing from './components/Missing';
import Landing from './components/Landing';
import GetStarted from './components/GetStarted';
import UserRegistration from './components/UserRegistration';
import FixerRegistration from './components/FixerRegistration';
import UserLogin, { action as userLoginAction } from './components/UserLogin';
import FixerLogin, { action as fixerLoginAction } from './components/FixerLogin';
import PersistLogin from './components/PersistLogin';
import RequireAuthRoot from './components/RequireAuthRoot';
import RequireAuth from './components/RequireAuth';
import DemoApp from './components/DemoApp';
import Unauthorized from './components/Unauthorized';
import UserHome from './components/UserHome';
import UserHowTo from './components/UserHowTo';
import FindFixer from './components/FindFixer';
import UserSettings from './components/UserSettings';
import FixerHome from './components/FixerHome';
import FixerHowTo from './components/FixerHowTo';
import FindWork from './components/FindWork';
import FixerSettings from './components/FixerSettings';

const ROLES = {
  user: 2505,
  premiumUser: 4938,
  fixer: 3450,
  premiumFixer: 5326,
}

function App() {

  return (
    <Route path='/' element={<Layout />} errorElement={<ErrorPage />}>
        <Route path='welcome' element={<Landing />} />
        <Route path='get-started' element={<GetStarted />} />
        <Route path='user-login' element={<UserLogin />} action={userLoginAction}/>
        <Route path='fixer-login' element={<FixerLogin />} action={fixerLoginAction}/>
        <Route path='user-registration' element={<UserRegistration />} />
        <Route path='fixer-registration' element={<FixerRegistration />} />
        <Route path='how-it-works' element={<DemoApp />} />
        <Route path='unauthorized' element={<Unauthorized />} />

      <Route element={<PersistLogin userRoles={[ROLES.user, ROLES.premiumUser]} fixerRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
        <Route element={<RequireAuthRoot userRoles={[ROLES.user, ROLES.premiumUser]} fixerRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
          <Route path='/' element={<UserHome />} /*loader={userLoader}*/>
            <Route index element={<UserHowTo />} />
            <Route path='get-help' element={<FindFixer />} /*loader action={appLoader}*//>
            <Route path='settings' element={<UserSettings /*loader action*/ />}/>
          </Route>
        </Route>

        <Route element={<RequireAuth allowedRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
          <Route path='/fixers' element={<FixerHome />} /*loader={fixerLoader}*/ >
            <Route index element={<FixerHowTo />} />
            <Route path='find-work' element={<FindWork />} /*loader={workLoader}* action*/ />
            <Route path='settings' element={<FixerSettings />} /*loader action */ />
          </Route>
        </Route>

      </Route>

      <Route path='*' element={<Missing />} />
    </Route>
  )
}

export default App
