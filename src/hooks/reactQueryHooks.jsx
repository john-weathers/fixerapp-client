import { useQuery } from '@tanstack/react-query';

const profileQuery = (axios, url) => ({
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

const geolocationQuery = {
  queryKey: ['location', 'current'],
  queryFn: () => {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
      }
      function success(pos) {
        resolve(pos.coords);
      }
      function error(err) {
        reject(err)
      }
      navigator.geolocation.getCurrentPosition(success, error, options);
    });
  }
}

export const useGeolocation = () => {
  return useQuery(geolocationQuery);
}

export const prefetchGeolocation = async (client) => {
  try {
    await client.prefetchQuery(geolocationQuery);
  } catch (err) {
    console.log(err);
  }
}

const requestQuery = (axios, url) => ({
  queryKey: ['request'],
  queryFn: async () => {
    const { data } = await axios.get(url);
    return data;
  },
  staleTime: 0, // NOTE: keep on eye on staleTime and adjust if needed
});

export const useRequest = (axios, url) => {
  return useQuery(requestQuery(axios, url));
}

