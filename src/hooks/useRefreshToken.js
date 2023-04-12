import axios from '../api/axios';
import useAuth from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import useLocalStorage from './useLocalStorage';

const useRefreshToken = () => {
    const { auth, setAuth } = useAuth();
    const queryClient = useQueryClient();
    const [userType] = useLocalStorage('userType', null);
    let refreshURL;

    if (userType === 'fixer') {
        refreshURL = '/fixer/refresh';
    } else {
        refreshURL = '/user/refresh';
    }

    // below is part of a temporary fix to the problem of multiple rapid successive refreshes
    // long-term solution could be a middleware type implementation that ultimately causes only one http request to go out for each batch of refreshes
    // the other attempted refresh calls turn into promises that are resolved or rejected with the single http response
    const refresh = async () => {
        const response = await axios.get(refreshURL, {
            withCredentials: true
        });
        console.log(response);
        if (response.status === 200 && !response?.data?.doubleRefresh) {
            setAuth(prev => {
                console.log(JSON.stringify(prev));
                console.log(response.data.accessToken);
                return {
                    ...prev,
                    accessToken: response.data.accessToken
                }
            });
        } else {
            console.log('double refresh occurred');
        }
        return response.data.accessToken;
        
    }
    return refresh;
};

export default useRefreshToken;