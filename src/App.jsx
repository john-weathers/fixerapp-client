import {
  Route,
  createBrowserRouter,
  createRoutesFromElements, 
} from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import Layout from './public-components/Layout';
import ErrorPage from './public-components/ErrorPage';
import Missing from './public-components/Missing';
import Landing from './public-components/Landing';
import GetStarted from './public-components/GetStarted';
import UserRegistration from './public-components/UserRegistration';
import FixerRegistration from './public-components/FixerRegistration';
import UserLogin from './public-components/UserLogin';
import FixerLogin from './public-components/FixerLogin';
import PersistLogin from './public-components/PersistLogin';
import RequireAuthRoot from './public-components/RequireAuthRoot';
import RequireAuth from './public-components/RequireAuth';
import DemoApp from './public-components/DemoApp';
import Unauthorized from './public-components/Unauthorized';
import UserHome from './private-components/UserHome';
import UserIndex from './private-components/UserIndex';
import QuickFixUser from './private-components/QuickFixUser';
import Proposals from './private-components/Proposals';
import UserSchedule from './private-components/UserSchedule';
import UserProfile from './private-components/UserProfile';
import UserSettings from './private-components/UserSettings';
import FixerHome from './private-components/FixerHome';
import FixerIndex from './private-components/FixerIndex';
import QuickFix from './private-components/QuickFix';
import Bid from './private-components/Bid';
import FixerSchedule from './private-components/FixerSchedule';
import FixerProfile from './private-components/FixerProfile';
import FixerSettings from './private-components/FixerSettings';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
    }
  }
});

const ROLES = {
  user: 2505,
  premiumUser: 4938,
  fixer: 3450,
  premiumFixer: 5326,
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<Layout />} errorElement={<ErrorPage />}>
        <Route path='welcome' element={<Landing />} />
        <Route path='get-started' element={<GetStarted />} />
        <Route path='user-login' element={<UserLogin />} />
        <Route path='fixer-login' element={<FixerLogin />} />
        <Route path='user-registration' element={<UserRegistration />} />
        <Route path='fixer-registration' element={<FixerRegistration />} />
        <Route path='how-it-works' element={<DemoApp />} />
        <Route path='unauthorized' element={<Unauthorized />} />

      <Route element={<PersistLogin userRoles={[ROLES.user, ROLES.premiumUser]} fixerRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
        <Route element={<RequireAuthRoot userRoles={[ROLES.user, ROLES.premiumUser]} fixerRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
          <Route path='/' element={<UserHome />} >
            <Route index element={<UserIndex />} />
            <Route path='quick-fix' element={<QuickFixUser />} /*loader action={appLoader}*/ />
            <Route path='proposals' element={<Proposals />} />
            <Route path='schedule' element={<UserSchedule />} />
            <Route path='profile' element={<UserProfile />}/>
            <Route path='settings' element={<UserSettings />}/>
            {
            /*<Route path='planning-tool' loader action />
            <Route path='settings' element={<UserSettings loader action />}/>*/
            }
          </Route>
        </Route>

        <Route element={<RequireAuth allowedRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
          <Route path='/fixers' element={<FixerHome />} >
            <Route index element={<FixerIndex />} />
            <Route path='quick-fix' element={<QuickFix />} />
            <Route path='bid' element={<Bid />}/>
            <Route path='schedule' element={<FixerSchedule />}/>
            <Route path='profile' element={<FixerProfile />}/>
            <Route path='settings' element={<UserSettings />}/>
            {
            /*<Route path='schedule' loader action />
            <Route path='settings' element={<FixerSettings />} loader action />*/
            }
          </Route>
        </Route>

      </Route>

      <Route path='*' element={<Missing />} />
    </Route>
  )
)
