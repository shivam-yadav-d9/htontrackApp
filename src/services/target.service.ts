import { api } from "./api";

export const targetService = {
  async getMonthlyTarget(employeeId: string | number) {
    return api.get(
      `/ontrack/target/staff/monthly/${employeeId}`
    );
  },

  async getDailyTargets(employeeId: string | number) {
    return api.get(
      `/ontrack/target/staff/daily/${employeeId}`
    );
  },
};