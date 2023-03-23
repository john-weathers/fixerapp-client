import axios from '../api/axios';
import useAuth from './useAuth';
import useLocalStorage from './useLocalStorage';

const useRefreshToken = () => {
    const { setAuth } = useAuth();
    const [userType] = useLocalStorage('userType', null);
    let refreshURL;

    if (userType === 'fixer') {
        refreshURL = '/fixer/refresh';
    } else {
        refreshURL = '/user/refresh';
    }

    const refresh = async () => {
        // additional error handling needed? Determine best course in testing, but catching and setting auth to empty object (probably better than just "deleting" the access token)
        // then navigating to home page seems sufficient
        const response = await axios.get(refreshURL, {
            withCredentials: true
        });
        setAuth(prev => {
            console.log(JSON.stringify(prev));
            console.log(response.data.accessToken);
            return {
                ...prev,
                accessToken: response.data.accessToken
            }
        });
        return response.data.accessToken;
    }
    return refresh;
};

export default useRefreshToken;