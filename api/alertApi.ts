
import { apiClient, ApiResponse } from "./client";
import { alertService, Alert } from "../services/alertService";

export const alertApi = {
  /** GET /api/alerts */
  async getAlerts(): Promise<ApiResponse<Alert[]>> {
    const data = alertService.getAlerts();
    return { data, status: 200, message: "OK" };
  },

  /** POST /api/alerts */
  async createAlert(alert: any): Promise<ApiResponse<string>> {
    const id = alertService.createAlert(alert);
    return { data: id, status: 201, message: "Created" };
  },

  /** DELETE /api/alerts/:id */
  async deleteAlert(id: string): Promise<ApiResponse<void>> {
    alertService.deleteAlert(id);
    return { data: undefined, status: 204, message: "Deleted" };
  }
};
