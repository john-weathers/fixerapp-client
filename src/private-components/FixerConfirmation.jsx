import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, useGeolocation, useRequest } from '../hooks/reactQueryHooks';
import Map, { Marker } from 'react-map-gl';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const MAPBOX_TOKEN = import.meta.env.VITE_MAP_SECRET_TOKEN;
const mapboxClient = mapboxSdk({ accessToken: MAPBOX_TOKEN });
const PROFILE_URL = '/fixers/profile';
const CURRENT_URL = '/fixers/work/current';
const DIRECTIONS_URL = '/fixers/work/directions';
const ESTIMATE_URL = '/fixers/work/estimate';

const FixerConfirmation = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { isLoading, isError, error, data: jobDetails } = useRequest(axiosPrivate, CURRENT_URL);
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState('');
  const [intervalId, setIntervalId] = useState(null);
  const [viewState, setViewState] = useState()

  // can use bbox, lineString (from turf) and fitBounds (from mapbox) to orient map once directions are available
  // might be best to return the fixer location (for fixers) to use as a starting point to orient the map
  // or do the initial directions api call in the findWork function (could be best)
  const mutation = useMutation({
    mutationFn: async () => {
      function getPosition() {
        return new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        })
      }
      const pos = await getPosition(); // can include an onClick handler on the Map component to update the location manually for testing purposes
      return await axiosPrivate.patch(DIRECTIONS_URL, { // NOTE: consider updating this to a socket based system
        fixerLocation: [pos.coords.longitude, pos.coords.latitude],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request'] });
    },
    onError: (error) => {
      console.log(error.message); // NOTE: revisit error handling during testing for at least two reasons
      // 1. certain errors may indicate the need to delete or repair the Request document or develop certain contingencies
      // 2. could utilize React or React Router error handling
    }
  })
  
  useEffect(() => {
    mutation.mutate();
    const interval = setInterval(() => {
      mutation.mutate();
    }, 1000 * 15)
    setIntervalId(interval);

    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [])

  if (isLoading) return <div>Loading...</div>;

  if (isError) return <div>Error: {error.message}</div>

  if (jobDetails.trackerStage === 'en route') return (
    <>

    </>
  )

  if (jobDetails.trackerStage === 'arriving') return (
    <>
    
    </>
  )

  if (jobDetails.trackerStage === 'estimating') return (
    <div>

    </div>
  )

  if (jobDetails.trackerStage === 'fixing') return (
    <div>

    </div>
  )

  if (jobDetails.trackerStage === 'complete') return (
    <div>
      
    </div>
  )

  return (
    <div>FixerConfirmation</div> // default return? would indicate some type of issue so could be a fallback to cancel the Request or similar
  )
}
export default FixerConfirmation;

// with tracker stages:
// en route: display map and directions (can reverseGeocode to get address...in production would likely require an address) setInterval for updating Fixer's location server side,
// method of updating tracker stage (could be a button on f/e or based on proximity), clear interval
// promiximity might be preferable for ease of use...for testing purposes we can use a button

// arriving: could potentially show customer details at this point (name, profile photo, etc.) or add more details once at this stage, such as showing the photo
// could also add functionality/information to give more details about repair issue earlier in the process and/or at this point
// prompt for estimated job cost, should go to customer, once accepted we move to fixing stage

// fixing: could possibly show timer on how long fix has been ongoing, but mainly we need to display a button to indicate job being finished
// this could trigger payment for customer (other option would be to handle payment when job starts, or a hybrid such as taking a deposit and charging the final amount
// depending on the job)