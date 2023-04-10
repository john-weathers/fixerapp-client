import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from '../hooks/useRefreshToken';
import { useRefresh } from "../hooks/reactQueryHooks";
import useAuth from '../hooks/useAuth';
import useLocalStorage from "../hooks/useLocalStorage";

const PersistLogin = () => {
    const { auth } = useAuth();
    // const [isLoading, setIsLoading] = useState(true);
    const refresh = useRefreshToken();
    const [persist] = useLocalStorage('persist', false);
    const { isLoading } = useRefresh(auth, persist, refresh);

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
                    ? <p>Loading...</p>
                    : <Outlet />
            }
        </>
    )
}

export default PersistLogin