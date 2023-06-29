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

    // below includes part of a fix to the problem of multiple rapid successive refreshes
    // long-term solution could be a middleware type implementation that ultimately causes only one http request to go out for each batch of refreshes
    // the other attempted refresh calls turn into promises that are resolved or rejected with the single http response
    const refresh = async () => {
        try {
            const response = await axios.get(refreshURL, {
                withCredentials: true
            });
            
            if (response.status === 200 && !response?.data?.doubleRefresh) {
                setAuth(prev => {
                    return {
                        ...prev,
                        accessToken: response.data.accessToken
                    }
                });
            }
    
            if (response) return response.data.accessToken;
        } catch (err) {
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                setAuth({});
            }
            return null;
        }
        
        
    }
    return refresh;
};

export default useRefreshToken;