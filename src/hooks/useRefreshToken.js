import axios from '../api/axios';
import useAuth from './useAuth';
import useLocalStorage from './useLocalStorage';

const useRefreshToken = () => {
    const { setAuth } = useAuth();
    const [userType] = useLocalStorage('userType', null);
    let refreshURL;

    if (userType === 'fixer') {
        refreshURL = '/fixerRefresh';
    } else {
        refreshURL = '/userRefresh';
    }

    const refresh = async () => {
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