import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from '../hooks/useRefreshToken';
import { useRefresh } from '../hooks/reactQueryHooks';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useAuth from '../hooks/useAuth';
import useLocalStorage from "../hooks/useLocalStorage";

const PersistLogin = () => {
    const { auth, setAuth } = useAuth();
    // const [isLoading, setIsLoading] = useState(true);
    const refresh = useRefreshToken();
    const [persist] = useLocalStorage('persist', false);
    // probably would prefer useEffect along with some type of middleware to catch multiple successive refresh calls
    // but using useQuery in this situation for now in development to limit the refresh calls
    const { isLoading } = useRefresh(auth, persist, refresh, setAuth);

    /*useEffect(() => {
        let isMounted = true;

        const verifyRefreshToken = async () => {
            try {
                await refresh();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                isMounted && setIsLoading(false);
            }
        }
        
        !auth?.accessToken && persist ? verifyRefreshToken() : setIsLoading(false);

        return () => {
            isMounted = false;
        }
    }, []);*/

    useEffect(() => {
        console.log(`isLoading: ${isLoading}`)
        console.log(`aT: ${JSON.stringify(auth?.accessToken)}`)
    }, [isLoading])

    return (
        <>
            {!persist
                ? <Outlet />
                : isLoading
                    ? (
                        <div className='loading'>
                            <FontAwesomeIcon icon={faSpinner} spin size='3x'/>
                        </div>
                    ) : <Outlet />
            }
        </>
    )
}

export default PersistLogin