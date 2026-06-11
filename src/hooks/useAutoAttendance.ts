import { useEffect, useRef } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native'; import type { LocationSubscription } from 'expo-location';
import { attendanceService } from '@/services/attendance.service';
import { watchLocation } from '@/utils/location';

const STORE_LAT = 19.136851;
const STORE_LNG = 72.862235;
const CHECKIN_RADIUS = 100;
const CHECKOUT_RADIUS = 100;

function getDistanceInMeters(
    lat1: number, lon1: number,
    lat2: number, lon2: number
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

    useEffect(() => {
        async function init() {
            // Step 1: Get current check-in status before starting watcher
            try {
                const data = await attendanceService.getMyAttendance();
                isCheckedInRef.current = !!data?.active_session;
                console.log('[AutoAttendance] initialized, isCheckedIn =', isCheckedInRef.current);
            } catch (err) {
                console.log('[AutoAttendance] could not fetch attendance on init:', err);
            }

            // Step 2: Start location watcher
            try {
                locationSub.current = await watchLocation(async (loc) => {
                    const distance = getDistanceInMeters(
                        loc.latitude, loc.longitude,
                        STORE_LAT, STORE_LNG
                    );

                    console.log('[AutoAttendance] distance =', Math.round(distance), 'm | isCheckedIn =', isCheckedInRef.current);

                    // Auto Check-In
                    if (!isCheckedInRef.current && distance <= CHECKIN_RADIUS) {
                        console.log('[AutoAttendance] AUTO CHECK-IN triggered');
                        isCheckedInRef.current = true;
                        try {
                            await attendanceService.checkIn({
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                            });

                            console.log('[AutoAttendance] AUTO CHECK-IN success');

                            // refresh attendance screen after backend saves record
                            setTimeout(() => {
                                DeviceEventEmitter.emit('ATTENDANCE_UPDATED');
                            }, 1500);
                        } catch (error) {
                            console.log('[AutoAttendance] AUTO CHECK-IN failed:', error);
                            isCheckedInRef.current = false;
                        }
                        return;
                    }

                    // Auto Check-Out
                    if (isCheckedInRef.current && distance > CHECKOUT_RADIUS) {
                        console.log('[AutoAttendance] AUTO CHECK-OUT triggered');
                        isCheckedInRef.current = false;
                        try {
                            await attendanceService.checkOut({
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                            });

                            console.log('[AutoAttendance] AUTO CHECK-OUT success');

                            // refresh attendance screen after backend saves record
                            setTimeout(() => {
                                DeviceEventEmitter.emit('ATTENDANCE_UPDATED');
                            }, 1500);
                        } catch (error) {
                            console.log('[AutoAttendance] AUTO CHECK-OUT failed:', error);
                            isCheckedInRef.current = true;
                        }
                    }
                });
            } catch (err) {
                Alert.alert(
                    'Location Permission',
                    err instanceof Error ? err.message : 'Location permission is required for auto attendance.'
                );
            }
        }

        init();

        return () => {
            locationSub.current?.remove();
            console.log('[AutoAttendance] watcher stopped');
        };
    }, []);

    return { isCheckedInRef };
}