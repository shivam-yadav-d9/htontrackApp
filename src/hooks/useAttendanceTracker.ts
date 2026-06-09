import { useEffect } from "react";
import * as Location from "expo-location";

import { attendanceService } from "@/services/attendance.service";
import { useAuthStore } from "@/store/auth.store";

export function useAttendanceTracker() {
  const { is_authenticated } = useAuthStore();

  useEffect(() => {
    if (!is_authenticated) return;

    let subscription: Location.LocationSubscription | null = null;

    async function startTracking() {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          return;
        }

        subscription =
          await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 30000,
              distanceInterval: 50,
            },
            async (location) => {
              try {
                await attendanceService.locationPing({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  accuracy: location.coords.accuracy,
                  altitude: location.coords.altitude,
                  heading: location.coords.heading,
                  speed: location.coords.speed,
                  device_timestamp:
                    new Date().toISOString(),
                });
              } catch (err) {
                console.log(
                  "Attendance ping failed",
                  err
                );
              }
            }
          );
      } catch (err) {
        console.log("Location tracking error", err);
      }
    }

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, [is_authenticated]);
}