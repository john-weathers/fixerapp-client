import { Route } from 'react-router-dom';

const ROLES = {
  user: 2505,
  premiumUser: 4938,
  fixer: 3450,
  premiumFixer: 5326,
}

function App() {

  return (
    <Route path='/' element={<Layout />} errorElement={<ErrorPage />}>
      <Route index element={<Landing />} />
      <Route path='welcome' element={<Landing />} />
      <Route path='get-started' element={<GetStarted />} />
      <Route path='user-login' element={<UserLogin />} />
      <Route path='fixer-login' element={<FixerLogin />} />
      <Route path='register' element={<Register />} action={registerAction} />
      <Route path='unauthorized' element={<Unauthorized />} />

      <Route element={<PersistentLogin />}>
        <Route element={<RequireAuthRoot userRoles={[ROLES.user, ROLES.premiumUser]} fixerRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
          <Route path='/' element={<UserHome />} loader={userLoader}>
            <Route index element={<UserHowTo />} />
            <Route path='get-help' element={<FindFixer />} action/>
            <Route path='settings' element={<UserSettings />}/>
          </Route>
        </Route>

        <Route element={<RequireAuth allowedRoles={[ROLES.fixer, ROLES.premiumFixer]} />}>
          <Route path='/fixers' element={<FixerHome />} loader={fixerLoader}>
            <Route index element={<FixerHowTo />} />
            <Route path='find-work' loader={workLoader} />
            <Route path='settings' element={<FixerSettings />} />
          </Route>
        </Route>

      </Route>
    </Route>
  )
}

export default App
