
import { apiClient, ApiResponse } from "./client";
import { MarketDataService } from "../services/marketData";
import { MultiAssetService } from "../services/multiAssetData";
import { NewsService } from "../services/newsService";
import { SocialSentimentService } from "../services/socialSentiment";
import { Quote, OHLCV, WatchlistItem, NewsArticle, SocialSentiment, AssetClass } from "../types";

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
  },

  // ============================================================================
  // MULTI-ASSET ENDPOINTS
  // ============================================================================

  /** GET /api/market/quote/:symbol */
  async getQuote(symbol: string): Promise<ApiResponse<Quote>> {
    const data = await MultiAssetService.getQuote(symbol);
    if (!data) {
      return { data: null, status: 404, message: "Symbol not found" };
    }
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/history/:symbol/:days */
  async getAssetHistory(symbol: string, days: number = 30): Promise<ApiResponse<OHLCV[]>> {
    const data = await MultiAssetService.getHistory(symbol, days);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/quotes/:assetClass */
  async getQuotesByClass(assetClass: AssetClass): Promise<ApiResponse<Quote[]>> {
    const data = await MultiAssetService.getQuotesByClass(assetClass);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/all-quotes */
  async getAllQuotes(): Promise<ApiResponse<Quote[]>> {
    const data = await MultiAssetService.getAllQuotes();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/search */
  async searchSymbols(query: string): Promise<ApiResponse<{ symbol: string; name: string; assetClass: AssetClass }[]>> {
    const data = MultiAssetService.searchSymbols(query);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/symbols/:assetClass */
  async getSymbolsByClass(assetClass: AssetClass): Promise<ApiResponse<string[]>> {
    const data = MultiAssetService.getAvailableSymbols(assetClass);
    return { data, status: 200, message: "OK" };
  },

  // ============================================================================
  // NEWS ENDPOINTS
  // ============================================================================

  /** GET /api/market/news */
  async getNews(limit: number = 30): Promise<ApiResponse<NewsArticle[]>> {
    const data = await NewsService.getAllNews(limit);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/news/category/:category */
  async getNewsByCategory(category: string, limit: number = 20): Promise<ApiResponse<NewsArticle[]>> {
    const validCategories = ["general", "crypto", "forex", "commodity", "stock"];
    const cat = validCategories.includes(category) ? category as any : "general";
    const data = await NewsService.getNewsByCategory(cat);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/news/search */
  async searchNews(query: string, limit: number = 20): Promise<ApiResponse<NewsArticle[]>> {
    const data = await NewsService.searchNews(query, limit);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/news/sentiment */
  async getNewsSentiment(): Promise<ApiResponse<{ overall: number; bullish: number; bearish: number; neutral: number }>> {
    const data = await NewsService.getNewsSentiment();
    return { data, status: 200, message: "OK" };
  },

  // ============================================================================
  // SOCIAL SENTIMENT ENDPOINTS
  // ============================================================================

  /** GET /api/market/social/sentiment */
  async getSocialSentiment(): Promise<ApiResponse<SocialSentiment>> {
    const data = await SocialSentimentService.getOverallSentiment();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/social/topic/:topic */
  async getTopicSentiment(topic: string): Promise<ApiResponse<{ overall: number; label: string; tweets: any[]; redditPosts: any[] }>> {
    const data = await SocialSentimentService.getTopicSentiment(topic);
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/social/crypto */
  async getCryptoSentiment(): Promise<ApiResponse<{ overall: number; label: string; coins: any[] }>> {
    const data = await SocialSentimentService.getCryptoSentiment();
    return { data, status: 200, message: "OK" };
  },

  /** GET /api/market/social/trending */
  async getTrendingTags(): Promise<ApiResponse<{ tag: string; volume: number }[]>> {
    const data = await SocialSentimentService.getOverallSentiment();
    return { data: data.trending, status: 200, message: "OK" };
  }
};
