import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RequireAuthRoot = ({ userRoles, fixerRoles }) => {
    const { auth } = useAuth();
    const location = useLocation();

    return (
        auth?.roles.find(role => userRoles?.includes(role))
            ? <Outlet />
            : auth?.roles.find(role => fixerRoles?.includes(role))
                ? <Navigate to='/fixers' state={{ from: location }} replace />
                : auth?.accessToken
                    ? <Navigate to='/unauthorized' state={{ from: location }} replace />
                    : <Navigate to='/welcome' state={{ from: location }} replace />
    );
}

export default RequireAuthRoot;