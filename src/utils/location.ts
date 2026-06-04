import * as Location from 'expo-location';

export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  device_timestamp?: string | null;
};

export async function requestLocationPermission(): Promise<true> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission is required for attendance.');
  }
  return true;
}

export async function getCurrentLocation(): Promise<CurrentLocation> {
  await requestLocationPermission();
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    heading: location.coords.heading,
    speed: location.coords.speed,
    device_timestamp: new Date(location.timestamp).toISOString(),
  };
}

export async function watchLocation(
  onLocation: (location: CurrentLocation) => void,
  onError?: (error: Error) => void,
): Promise<Location.LocationSubscription> {
  await requestLocationPermission();
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 15000,
      distanceInterval: 15,
    },
    (location) => {
      try {
        onLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
          device_timestamp: new Date(location.timestamp).toISOString(),
        });
      } catch (error) {
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
  );
}
