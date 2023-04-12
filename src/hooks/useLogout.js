import axios from "../api/axios";
import useAuth from "./useAuth";
import useLocalStorage from "./useLocalStorage";
import { useQueryClient } from "@tanstack/react-query";

const useLogout = () => {
  const { setAuth } = useAuth();
  const queryClient = useQueryClient();
  const [userType] = useLocalStorage('userType', null);
  let logoutURL;

  if (userType === 'fixer') {
    logoutURL = '/fixer/logout';
  } else {
    logoutURL = '/user/logout';
  }

  const logout = async () => {
    queryClient.removeQueries(['profile']);
    queryClient.removeQueries(['request']);
    setAuth({});
    try { 
      const response = await axios.get(logoutURL, {
        withCredentials: true
      });
    } catch (err) {
      console.error(err);
    }
  }

  return logout;
}

export default useLogout;