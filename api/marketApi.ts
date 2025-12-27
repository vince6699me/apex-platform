
import { apiClient, ApiResponse } from "./client";
import { MarketDataService } from "../services/marketData";
import { Quote, OHLCV, WatchlistItem } from "../types";

export const marketApi = {
  /** GET /api/market/trending */
  async getTrending(): Promise<ApiResponse<Quote[]>> {
    const data = MarketDataService.getTrendingSymbols();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/history/:symbol */
  async getHistory(symbol: string, days: number = 30): Promise<ApiResponse<OHLCV[]>> {
    const data = MarketDataService.generateHistoricalData(symbol, days);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/watchlist */
  async getWatchlist(): Promise<ApiResponse<WatchlistItem[]>> {
    const data = MarketDataService.generateWatchlist();
    return { data, status: 200, message: "OK" };
  }
};
