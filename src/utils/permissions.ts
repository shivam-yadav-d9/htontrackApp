import { User } from '@/types/auth.types';

export type PermissionKey = string;

export function hasPermission(user: User | null, permission: PermissionKey): boolean {
  if (!user) return false;
  const perms = user.permissions ?? [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  // wildcard prefix: "employees:*" covers "employees:read"
  const resource = permission.split(':')[0];
  if (perms.includes(`${resource}:*`)) return true;
  return false;
}

export function hasAnyPermission(user: User | null, permissions: PermissionKey[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user: User | null, permissions: PermissionKey[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}

export function isManager(user: User | null): boolean {
  return user?.role === 'MANAGER';
}

export function isStaff(user: User | null): boolean {
  return user?.role === 'STAFF';
}
