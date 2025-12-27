
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
    const data = await MarketDataService.getHistoryFromPolygon(symbol);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/watchlist */
  async getWatchlist(): Promise<ApiResponse<WatchlistItem[]>> {
    const baseWatchlist = MarketDataService.generateWatchlist();
    const updatedWatchlist = await Promise.all(baseWatchlist.map(async (item) => {
      try {
        const quote = await MarketDataService.getQuoteFromAlphaVantage(item.symbol);
        return { ...item, ...quote };
      } catch (e) {
        return item;
      }
    }));
    return { data: updatedWatchlist, status: 200, message: "OK" };
  }
};
