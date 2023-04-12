import { useQuery } from '@tanstack/react-query';
import jwt_decode from 'jwt-decode';

export const profileQuery = (axios, url) => ({
  queryKey: ['profile'],
  queryFn: async () => {
    const  { data } = await axios.get(url);
    return data;
  },
  staleTime: Infinity,
  cacheTime: 1000 * 60 * 30, // may need to revisit...I could see infinity being a more logical choice here.
});

export const useProfile = (axios, url) => {
  return useQuery(profileQuery(axios, url));
}

export const prefetchProfile = async (client, axios, url) => {
  try {
    await client.prefetchQuery(profileQuery(axios, url));
  } catch (err) {
    console.log(err);
  }
}

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
  }
}

export const useGeolocation = () => {
  return useQuery(geolocationQuery);
}

/*export const prefetchGeolocation = async (client) => {
  try {
    await client.prefetchQuery(geolocationQuery);
  } catch (err) {
    console.log(err);
  }
}*/

const requestQuery = (axios, url) => ({
  queryKey: ['request'],
  queryFn: async () => {
    const { data } = await axios.get(url);
    return data;
  },
  staleTime: 0, // NOTE: keep on eye on staleTime and adjust if needed
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
  retry: 0, // current setup seems to be functioning properly but might think about amending this to 1 or 2 if helpful
  staleTime: 0,
})

export const useRefresh = (auth, persist, refresh, setAuth) => {
  return useQuery(refreshQuery(auth, persist, refresh, setAuth));
}