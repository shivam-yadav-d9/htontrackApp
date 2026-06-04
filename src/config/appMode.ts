/**
 * APP_MODE controls whether the app uses the live backend or local bundled data.
 *
 * "offline_apk" — All data comes from AsyncStorage seeded from bundled JSON files.
 *                 No backend or internet connection required.
 *                 Manager and staff on different phones will NOT sync.
 *                 For real production, switch to "backend" and configure API URL.
 *
 * "backend"     — All services use the live FastAPI backend at EXPO_PUBLIC_API_URL.
 */
export const APP_MODE: 'offline_apk' | 'backend' = 'offline_apk';
