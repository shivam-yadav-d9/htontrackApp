import { useEffect, useRef } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';
import type { LocationSubscription } from 'expo-location';
import { attendanceService } from '@/services/attendance.service';
import { watchLocation } from '@/utils/location';

const STORE_LAT = 19.136851;
const STORE_LNG = 72.862235;

const CHECKIN_RADIUS = 100;
const CHECKOUT_RADIUS = 150;

const COOLDOWN_MS = 30_000;

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useAutoAttendance() {
  const locationSub = useRef<LocationSubscription | null>(null);
  const isCheckedInRef = useRef(false);
  const lastActionAt = useRef(0);

  useEffect(() => {
    async function init() {
      try {
        const data = await attendanceService.getMyAttendance();

        isCheckedInRef.current = !!data?.active_session;

        console.log(
          '[AutoAttendance] INIT',
          {
            checkedIn: isCheckedInRef.current,
            activeSession: data?.active_session,
          }
        );
      } catch (err) {
        console.warn(
          '[AutoAttendance] failed to load attendance state',
          err
        );
      }

      try {
        locationSub.current = await watchLocation(async (loc) => {
          const distance = getDistanceInMeters(
            loc.latitude,
            loc.longitude,
            STORE_LAT,
            STORE_LNG
          );

          const now = Date.now();

          const insideForCheckin =
            distance <= CHECKIN_RADIUS;

          const outsideForCheckout =
            distance > CHECKOUT_RADIUS;

          console.log(
            '[AutoAttendance]',
            {
              distance: Math.round(distance),
              insideForCheckin,
              outsideForCheckout,
              checkedIn: isCheckedInRef.current,
            }
          );

          if (
            now - lastActionAt.current <
            COOLDOWN_MS
          ) {
            return;
          }

          // =========================
          // AUTO CHECK-IN
          // =========================

          if (
            !isCheckedInRef.current &&
            insideForCheckin
          ) {
            console.log(
              '[AutoAttendance] CHECK-IN TRIGGER'
            );

            isCheckedInRef.current = true;
            lastActionAt.current = now;

            try {
              await attendanceService.checkIn({
                latitude: loc.latitude,
                longitude: loc.longitude,
              });

              console.log(
                '[AutoAttendance] CHECK-IN SUCCESS'
              );

              setTimeout(() => {
                DeviceEventEmitter.emit(
                  'ATTENDANCE_UPDATED'
                );
              }, 1500);
            } catch (err) {
              console.error(
                '[AutoAttendance] CHECK-IN FAILED',
                err
              );

              isCheckedInRef.current = false;
              lastActionAt.current = 0;
            }

            return;
          }

          // =========================
          // AUTO CHECK-OUT
          // =========================

          if (
            isCheckedInRef.current &&
            outsideForCheckout
          ) {
            console.log(
              '[AutoAttendance] CHECK-OUT TRIGGER'
            );

            isCheckedInRef.current = false;
            lastActionAt.current = now;

            try {
              await attendanceService.checkOut({
                latitude: loc.latitude,
                longitude: loc.longitude,
              });

              console.log(
                '[AutoAttendance] CHECK-OUT SUCCESS'
              );

              // Verify backend state
              try {
                const latest =
                  await attendanceService.getMyAttendance();

                console.log(
                  '[AutoAttendance] ACTIVE SESSION AFTER CHECKOUT =',
                  latest?.active_session
                );
              } catch (e) {
                console.log(
                  '[AutoAttendance] could not verify backend state',
                  e
                );
              }

              setTimeout(() => {
                DeviceEventEmitter.emit(
                  'ATTENDANCE_UPDATED'
                );
              }, 1500);
            } catch (err) {
              console.error(
                '[AutoAttendance] CHECK-OUT FAILED',
                err
              );

              isCheckedInRef.current = true;
              lastActionAt.current = 0;
            }
          }
        });
      } catch (err) {
        Alert.alert(
          'Location Error',
          err instanceof Error
            ? err.message
            : 'Location permission is required for auto attendance.'
        );
      }
    }

    init();

    return () => {
      locationSub.current?.remove();
      console.log(
        '[AutoAttendance] watcher stopped'
      );
    };
  }, []);

  return {
    isCheckedInRef,
  };
}