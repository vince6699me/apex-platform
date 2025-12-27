
import { apiClient, ApiResponse } from "./client";
import { MarketDataService } from "../services/marketData";
import { Position } from "../types";

export const portfolioApi = {
  /** GET /api/portfolio/positions */
  async getPositions(): Promise<ApiResponse<Position[]>> {
    const data = MarketDataService.generatePositions();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/portfolio/performance */
  async getPerformance(days: number = 30): Promise<ApiResponse<{date: string, value: number}[]>> {
    const data = MarketDataService.generatePortfolioPerformance(days);
    return { data, status: 200, message: "OK" };
  }
};
