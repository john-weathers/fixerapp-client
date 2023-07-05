import { useLocation, Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import jwt_decode from 'jwt-decode';

const RequireAuthRoot = ({ userRoles, fixerRoles }) => {
    const { auth } = useAuth();
    const location = useLocation();

    const decoded = auth?.accessToken
        ? jwt_decode(auth.accessToken)
        : undefined

    const roles = decoded?.userInfo?.roles || [];

    return (
        roles.find(role => userRoles?.includes(role))
            ? <Outlet />
            : roles.find(role => fixerRoles?.includes(role))
                ? <Navigate to='/fixers' state={{ from: location }} replace />
                : auth?.accessToken
                    ? <Navigate to='/unauthorized' state={{ from: location }} replace />
                    : <Navigate to='/welcome' state={{ from: location }} replace />
    );
}

export default RequireAuthRoot;