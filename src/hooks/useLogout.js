import axios from "../api/axios";
import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";

const useLogout = () => {
  const { setAuth } = useAuth();
  const [userType] = useLocalStorage('userType', null);
  let logoutURL;

  if (userType === 'fixer') {
    logoutURL = '/fixerLogout';
  } else {
    logoutURL = '/userLogout';
  }

  const logout = async () => {
    setAuth({});
    try { 
      const response = await axios(logoutURL, {
        withCredentials: true
      });
    } catch (err) {
      console.error(err);
    }
  }

  return logout;
}

export default useLogout;