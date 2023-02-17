import { useQuery } from '@tanstack/react-query';

export const profileQuery = (axios, url) => ({
  queryKey: ['profile'],
  queryFn: async () => {
    const data = await axios.get(url);
    return data;
  }
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