import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function IndexScreen() {
  const { is_authenticated, is_loading, user } = useAuthStore();

  if (is_loading) return null;

  if (is_authenticated && user) {
    const role = String(user.role).toUpperCase();

    if (role === 'ADMIN') {
      return <Redirect href="/admin/dashboard" />;
    }

    if (role === 'MANAGER') {
      return <Redirect href="/manager/dashboard" />;
    }

    return <Redirect href="/staff/dashboard" />;
  }

  return <Redirect href="/auth/login" />;
}