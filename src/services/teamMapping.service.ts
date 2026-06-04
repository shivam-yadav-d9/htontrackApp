import { api } from "./api";

export const teamMappingService = {
  getSummary() {
    return api.get("/admin/team-mapping/summary");
  },

  validate() {
    return api.get("/admin/team-mapping/validate");
  },

  getByManager() {
    return api.get("/admin/team-mapping/by-manager");
  },

  getByStore(storeCode: string) {
    return api.get(`/admin/team-mapping/by-store/${storeCode}`);
  },
};
