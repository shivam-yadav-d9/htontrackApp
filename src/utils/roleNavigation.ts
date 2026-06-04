import { router } from "expo-router";

import type { User } from "@/types/auth.types";

export function routeByRole(user: User) {
  if (user.role === "ADMIN") {
    router.replace("/admin/dashboard");
    return;
  }

  if (user.role === "MANAGER") {
    router.replace("/manager/dashboard");
    return;
  }

  if (user.role === "STAFF") {
    router.replace("/staff/dashboard");
    return;
  }

  router.replace("/auth/login");
}
