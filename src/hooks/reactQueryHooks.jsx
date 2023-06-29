import { useQuery } from '@tanstack/react-query';
import jwt_decode from 'jwt-decode';

export const profileQuery = (axios, url) => ({
  queryKey: ['profile'],
  queryFn: async () => {
    const  { data } = await axios.get(url);
    return data;
  },
  staleTime: Infinity,
  cacheTime: 1000 * 60 * 30,
});

export const useProfile = (axios, url) => {
  return useQuery(profileQuery(axios, url));
}

/*export const prefetchProfile = async (client, axios, url, setErrMsg) => {
  try {
    await client.prefetchQuery(profileQuery(axios, url));
  } catch (err) {
    setErrMsg(err.message);
  }
}*/

export const geolocationQuery = {
  queryKey: ['location', 'current'],
  queryFn: () => {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
      }
      const success = pos => {
        resolve(pos.coords);
      }
      const error = err => {
        reject(err)
      }
      navigator.geolocation.getCurrentPosition(success, error, options);
    });
  },
  staleTime: 1000 * 20,
}

export const useGeolocation = () => {
  return useQuery(geolocationQuery);
}

/*export const prefetchGeolocation = async (client, setErrMsg) => {
  try {
    await client.prefetchQuery(geolocationQuery);
  } catch (err) {
    setErrMsg(err.message);
  }
}*/

const requestQuery = (axios, url) => ({
  queryKey: ['request'],
  queryFn: async () => {
    const { data } = await axios.get(url);
    return data;
  },
  staleTime: 0,
  retry: 0,
});

export const useRequest = (axios, url) => {
  return useQuery(requestQuery(axios, url));
}

const refreshQuery = (auth, persist, refresh, setAuth) => ({
  queryKey: ['refresh'],
  queryFn: async () => {
    if (!auth?.accessToken && persist) {
      await refresh();
      return 'token available';
    } else if (auth?.accessToken && !persist) {
      const decoded = jwt_decode(auth.accessToken);
      const decodedExp = decoded.exp * 1000;
      if (Date.now() >= decodedExp) {
        setAuth({});
        return null;
      }
      return 'token available';
    } else if (auth?.accessToken && persist) {
      return 'token available';
    } else {
      return null;
    }
  },
  retry: 0,
  staleTime: 0,
})

export const useRefresh = (auth, persist, refresh, setAuth) => {
  return useQuery(refreshQuery(auth, persist, refresh, setAuth));
}