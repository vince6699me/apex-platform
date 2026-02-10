/**
 * News Service
 * 
 * Provides real-time news from multiple sources:
 * - Financial news (general markets)
 * - Crypto news
 * - Forex news
 * - Commodity news
 * 
 * Uses free APIs:
 * - NewsAPI (free tier available)
 * - CryptoPanic (free for crypto)
 * - Finnhub (free tier available)
 */

import { NewsHeadline } from "../types";

// ============================================================================
// NEWS API CONFIGURATION
// ============================================================================

export interface NewsSource {
  id: string;
  name: string;
  category: "general" | "crypto" | "forex" | "commodity" | "stock";
  language: string;
  country: string;
  enabled: boolean;
}

export const NEWS_SOURCES: NewsSource[] = [
  // General Financial
  { id: "bloomberg", name: "Bloomberg", category: "general", language: "en", country: "us", enabled: true },
  { id: "reuters", name: "Reuters", category: "general", language: "en", country: "us", enabled: true },
  { id: "cnbc", name: "CNBC", category: "general", language: "en", country: "us", enabled: true },
  { id: "financial-times", name: "Financial Times", category: "general", language: "en", country: "gb", enabled: true },
  { id: "wall-street-journal", name: "Wall Street Journal", category: "general", language: "en", country: "us", enabled: true },
  
  // Crypto
  { id: "coindesk", name: "CoinDesk", category: "crypto", language: "en", country: "us", enabled: true },
  { id: "cryptopanic", name: "CryptoPanic", category: "crypto", language: "en", country: "us", enabled: true },
  { id: "decrypt", name: "Decrypt", category: "crypto", language: "en", country: "us", enabled: true },
  
  // Forex
  { id: "forexfactory", name: "Forex Factory", category: "forex", language: "en", country: "us", enabled: true },
  { id: "investing", name: "Investing.com", category: "forex", language: "en", country: "us", enabled: true },
];

// ============================================================================
// NEWSAPI SERVICE
// ============================================================================

export class NewsAPIService {
  private static API_KEY = (process.env as any).NEWS_API_KEY;
  private static NEWS_DATA_KEY = (process.env as any).NEWS_DATA_API_KEY || "pub_90c8a308a7bb4fb4b09aeecb148ad25d";
  private static FINNHUB_KEY = (process.env as any).FINNHUB_API_KEY || "d2niri1r01qvm11278tgd2niri1r01qvm11278u0";
  private static BASE_URL = "https://newsapi.org/v2";
  private static NEWS_DATA_URL = "https://newsdata.io/api/1";
  private static FINNHUB_URL = "https://finnhub.io/api/v1";
  
  /**
   * Get top business/financial headlines
   */
  static async getHeadlines(category: string = "business", limit: number = 20): Promise<NewsHeadline[]> {
    if (!this.API_KEY) {
      console.log("NewsAPI key not configured, using fallback");
      return this.getFallbackHeadlines();
    }
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/top-headlines?category=${category}&language=en&pageSize=${limit}&apiKey=${this.API_KEY}`
      );
      const data = await response.json();
      
      if (data.articles) {
        return data.articles
          .filter((article: any) => article.title && article.source?.name)
          .map((article: any, index: number) => ({
            id: `newsapi-${index}`,
            headline: article.title,
            source: article.source.name,
            timestamp: new Date(article.publishedAt).getTime() || Date.now(),
            sentiment: this.analyzeSentiment(article.title),
            url: article.url,
            description: article.description
          }))
          .slice(0, limit);
      }
    } catch (error) {
      console.error("NewsAPI fetch failed:", error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  /**
   * Search news by keyword
   */
  static async searchNews(query: string, limit: number = 20): Promise<NewsHeadline[]> {
    if (!this.API_KEY) {
      return this.getFallbackHeadlines();
    }
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${this.API_KEY}`
      );
      const data = await response.json();
      
      if (data.articles) {
        return data.articles
          .filter((article: any) => article.title && article.source?.name)
          .map((article: any, index: number) => ({
            id: `newsapi-search-${index}`,
            headline: article.title,
            source: article.source.name,
            timestamp: new Date(article.publishedAt).getTime() || Date.now(),
            sentiment: this.analyzeSentiment(article.title),
            url: article.url
          }))
          .slice(0, limit);
      }
    } catch (error) {
      console.error("NewsAPI search failed:", error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  // ============================================================================
  // NEWSDATA.IO SERVICE
  // ============================================================================
  
  /**
   * Get news from NewsData.io
   */
  static async getNewsFromNewsData(category: string = "business", limit: number = 20): Promise<NewsHeadline[]> {
    try {
      const response = await fetch(
        `${this.NEWS_DATA_URL}/news?apikey=${this.NEWS_DATA_KEY}&category=${category}&language=en&size=${limit}`
      );
      const data = await response.json();
      
      if (data.results) {
        return data.results.map((article: any, index: number) => ({
          id: `newsdata-${index}`,
          headline: article.title,
          source: article.source_id || "NewsData",
          timestamp: article.pubDate ? new Date(article.pubDate).getTime() : Date.now(),
          sentiment: this.analyzeSentiment(article.title + " " + (article.description || "")),
          url: article.link,
          description: article.description
        }));
      }
    } catch (error) {
      console.error("NewsData.io fetch failed:", error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  /**
   * Get crypto news from NewsData.io
   */
  static async getCryptoNewsFromNewsData(limit: number = 20): Promise<NewsHeadline[]> {
    try {
      const response = await fetch(
        `${this.NEWS_DATA_URL}/news?apikey=${this.NEWS_DATA_KEY}&category=cryptocurrency&language=en&size=${limit}`
      );
      const data = await response.json();
      
      if (data.results) {
        return data.results.map((article: any, index: number) => ({
          id: `newsdata-crypto-${index}`,
          headline: article.title,
          source: article.source_id || "NewsData",
          timestamp: article.pubDate ? new Date(article.pubDate).getTime() : Date.now(),
          sentiment: this.analyzeSentiment(article.title + " " + (article.description || "")),
          url: article.link,
          description: article.description
        }));
      }
    } catch (error) {
      console.error("NewsData.io crypto fetch failed:", error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  // ============================================================================
  // FINNHUB SERVICE
  // ============================================================================
  
  /**
   * Get general news from Finnhub
   */
  static async getNewsFromFinnhub(limit: number = 20): Promise<NewsHeadline[]> {
    try {
      const response = await fetch(
        `${this.FINNHUB_URL}/news?category=general&token=${this.FINNHUB_KEY}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data.slice(0, limit).map((article: any, index: number) => ({
          id: `finnhub-${index}`,
          headline: article.headline,
          source: article.source || "Finnhub",
          timestamp: article.datetime ? article.datetime * 1000 : Date.now(),
          sentiment: this.analyzeSentiment(article.headline + " " + (article.summary || "")),
          url: article.url,
          description: article.summary
        }));
      }
    } catch (error) {
      console.error("Finnhub fetch failed:", error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  /**
   * Get market news from Finnhub
   */
  static async getMarketNewsFromFinnhub(limit: number = 20): Promise<NewsHeadline[]> {
    try {
      const response = await fetch(
        `${this.FINNHUB_URL}/news?category=technology&token=${this.FINNHUB_KEY}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data.slice(0, limit).map((article: any, index: number) => ({
          id: `finnhub-tech-${index}`,
          headline: article.headline,
          source: article.source || "Finnhub",
          timestamp: article.datetime ? article.datetime * 1000 : Date.now(),
          sentiment: this.analyzeSentiment(article.headline + " " + (article.summary || "")),
          url: article.url,
          description: article.summary
        }));
      }
    } catch (error) {
      console.error("Finnhub market news fetch failed:", error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  /**
   * Get company news from Finnhub
   */
  static async getCompanyNewsFromFinnhub(symbol: string, limit: number = 10): Promise<NewsHeadline[]> {
    const today = Math.floor(Date.now() / 1000);
    const weekAgo = today - 7 * 24 * 60 * 60;
    
    try {
      const response = await fetch(
        `${this.FINNHUB_URL}/company-news?symbol=${symbol}&from=${new Date(weekAgo * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${this.FINNHUB_KEY}`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data.slice(0, limit).map((article: any, index: number) => ({
          id: `finnhub-${symbol}-${index}`,
          headline: article.headline,
          source: article.source || "Finnhub",
          timestamp: article.datetime ? article.datetime * 1000 : Date.now(),
          sentiment: this.analyzeSentiment(article.headline + " " + (article.summary || "")),
          url: article.url
        }));
      }
    } catch (error) {
      console.error(`Finnhub company news for ${symbol} failed:`, error);
    }
    
    return this.getFallbackHeadlines();
  }
  
  /**
   * Get market sentiment from Finnhub
   */
  static async getSentimentFromFinnhub(symbol: string): Promise<{
    sentiment: number;
    bullish: number;
    bearish: number;
    neutral: number;
  }> {
    try {
      const response = await fetch(
        `${this.FINNHUB_URL}/stock/sentiment?symbol=${symbol}&token=${this.FINNHUB_KEY}`
      );
      const data = await response.json();
      
      if (data?.data?.[0]) {
        const s = data.data[0];
        return {
          sentiment: (parseFloat(s.sentiment || 0) + parseFloat(s.marketSentiment || 0)) / 2,
          bullish: parseFloat(s.sentiment || 0) > 0.25 ? 1 : 0,
          bearish: parseFloat(s.sentiment || 0) < -0.25 ? 1 : 0,
          neutral: parseFloat(s.sentiment || 0) >= -0.25 && parseFloat(s.sentiment || 0) <= 0.25 ? 1 : 0
        };
      }
    } catch (error) {
      console.error(`Finnhub sentiment for ${symbol} failed:`, error);
    }
    
    return { sentiment: 0, bullish: 0, bearish: 0, neutral: 1 };
  }
  
  /**
   * Simple sentiment analysis for news
   */
  private static analyzeSentiment(text: string): number {
    const positiveWords = ["rally", "surge", "gain", "growth", "bullish", "profit", "recovery", "soar", "jump", "rise"];
    const negativeWords = ["crash", "fall", "drop", "loss", "bearish", "decline", "plunge", "sink", "slump", "worry"];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.2;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * Fallback headlines when API is unavailable
   */
  private static getFallbackHeadlines(): NewsHeadline[] {
    const headlines = [
      { source: "Bloomberg", headline: "Fed signals potential rate cuts later this year as inflation cools", sentiment: 0.3 },
      { source: "Reuters", headline: "Global markets rally on strong earnings reports from tech sector", sentiment: 0.5 },
      { source: "CNBC", headline: "Oil prices stabilize amidst geopolitical tensions in Middle East", sentiment: 0.1 },
      { source: "Financial Times", headline: "European markets mixed as investors await ECB decision", sentiment: 0 },
      { source: "WSJ", headline: "Bitcoin surges past $65,000 on institutional buying interest", sentiment: 0.6 },
      { source: "Bloomberg", headline: "Gold prices retreat from record highs as dollar strengthens", sentiment: -0.2 },
      { source: "Reuters", headline: "Japanese yen volatile after BoJ policy announcement", sentiment: -0.1 },
      { source: "CoinDesk", headline: "Ethereum network upgrade successfully activates, boosting confidence", sentiment: 0.5 },
      { source: "CNBC", headline: "S&P 500 closes at record high amid tech rally", sentiment: 0.4 },
      { source: "Financial Times", headline: "Chinese markets decline on concerns over economic growth", sentiment: -0.3 }
    ];
    
    return headlines.map((item, index) => ({
      id: `fallback-${index}`,
      headline: item.headline,
      source: item.source,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      sentiment: item.sentiment
    }));
  }
}

// ============================================================================
// CRYPTO PANIC SERVICE (Free Crypto News)
// ============================================================================

export class CryptoPanicService {
  private static BASE_URL = "https://cryptopanic.com/api/v1";
  private static API_KEY = (process.env as any).CRYPTOPANIC_API_KEY;
  
  /**
   * Get crypto news from CryptoPanic
   */
  static async getNews(limit: number = 20): Promise<NewsHeadline[]> {
    try {
      const url = this.API_KEY
        ? `${this.BASE_URL}/posts?auth_token=${this.API_KEY}&public=true&limit=${limit}`
        : `${this.BASE_URL}/posts?public=true&limit=${limit}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        return data.results
          .filter((post: any) => post.title && post.source?.domain)
          .map((post: any, index: number) => ({
            id: `cryptopanic-${index}`,
            headline: post.title,
            source: post.source.domain,
            timestamp: new Date(post.created_at).getTime() || Date.now(),
            sentiment: this.analyzeSentiment(post.title),
            url: post.url,
            votes: post.votes
          }))
          .slice(0, limit);
      }
    } catch (error) {
      console.error("CryptoPanic fetch failed:", error);
    }
    
    return this.getFallbackCryptoNews();
  }
  
  /**
   * Get news filtered by currency
   */
  static async getNewsByCurrency(currency: string, limit: number = 10): Promise<NewsHeadline[]> {
    try {
      const url = this.API_KEY
        ? `${this.BASE_URL}/posts?auth_token=${this.API_KEY}&currencies=${currency}&public=true&limit=${limit}`
        : `${this.BASE_URL}/posts?currencies=${currency}&public=true&limit=${limit}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        return data.results
          .filter((post: any) => post.title && post.source?.domain)
          .map((post: any, index: number) => ({
            id: `cryptopanic-${currency}-${index}`,
            headline: post.title,
            source: post.source.domain,
            timestamp: new Date(post.created_at).getTime() || Date.now(),
            sentiment: this.analyzeSentiment(post.title)
          }))
          .slice(0, limit);
      }
    } catch (error) {
      console.error("CryptoPanic currency news failed:", error);
    }
    
    return this.getFallbackCryptoNews();
  }
  
  /**
   * Sentiment analysis for crypto headlines
   */
  private static analyzeSentiment(text: string): number {
    const positiveWords = ["surge", "rally", "moon", "bullish", "breakout", "adoption", "partnership", "upgrade", "gain", "soar"];
    const negativeWords = ["crash", "dump", "bearish", "hack", "scam", "ban", "regulation", "plunge", "drop", "worries"];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.25;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.25;
    });
    
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * Fallback crypto news
   */
  private static getFallbackCryptoNews(): NewsHeadline[] {
    const headlines = [
      { source: "CoinDesk", headline: "Bitcoin mining difficulty adjusts upward after hashrate increase", sentiment: 0.1 },
      { source: "CryptoPanic", headline: "Ethereum staking rewards attract institutional investors", sentiment: 0.4 },
      { source: "Decrypt", headline: "Regulatory uncertainty weighs on DeFi sector", sentiment: -0.3 },
      { source: "CoinDesk", headline: "Solana network experiences brief outage, now fully recovered", sentiment: 0 },
      { source: "CryptoPanic", headline: "Major exchange announces new listing, driving trading volume", sentiment: 0.3 }
    ];
    
    return headlines.map((item, index) => ({
      id: `crypto-fallback-${index}`,
      headline: item.headline,
      source: item.source,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      sentiment: item.sentiment
    }));
  }
}

// ============================================================================
// FOREX FACTORY SERVICE
// ============================================================================

export class ForexNewsService {
  /**
   * Get forex-specific news and economic events
   */
  static async getNews(): Promise<NewsHeadline[]> {
    // Forex Factory doesn't have a public API, so we use fallback
    return this.getFallbackForexNews();
  }
  
  /**
   * Get economic calendar events
   */
  static async getEconomicCalendar(): Promise<{
    event: string;
    country: string;
    impact: "High" | "Medium" | "Low";
    time: string;
    forecast?: string;
  }[]> {
    // Economic calendar events (simulated based on typical releases)
    return [
      { event: "FOMC Interest Rate Decision", country: "USD", impact: "High", time: "14:00 ET", forecast: "5.50%" },
      { event: "Non-Farm Payrolls", country: "USD", impact: "High", time: "08:30 ET", forecast: "185K" },
      { event: "ECB Rate Decision", country: "EUR", impact: "High", time: "13:45 ET", forecast: "4.50%" },
      { event: "GDP Growth Rate", country: "GBP", impact: "High", time: "02:00 ET", forecast: "0.3%" },
      { event: "Consumer Price Index", country: "JPY", impact: "High", time: "00:30 ET", forecast: "2.8%" },
      { event: "Retail Sales", country: "CAD", impact: "Medium", time: "08:30 ET", forecast: "0.5%" },
      { event: "Australian CPI", country: "AUD", impact: "Medium", time: "20:30 ET", forecast: "3.4%" },
      { event: "NZD GDP", country: "NZD", impact: "Medium", time: "21:45 ET", forecast: "0.4%" }
    ];
  }
  
  /**
   * Fallback forex news
   */
  private static getFallbackForexNews(): NewsHeadline[] {
    const headlines = [
      { source: "Forex Factory", headline: "USD/JPY breaks above 150.00 amid BoJ policy uncertainty", sentiment: -0.1 },
      { source: "Investing.com", headline: "EUR/USD consolidates near 1.0800 ahead of ECB meeting", sentiment: 0 },
      { source: "DailyFX", headline: "GBP/USD volatile after Bank of England policy announcement", sentiment: -0.1 },
      { source: "Forex Factory", headline: "AUD/USD supported by stronger-than-expected employment data", sentiment: 0.2 },
      { source: "Investing.com", headline: "EUR/GBP edges higher as UK economy shows signs of weakness", sentiment: -0.1 }
    ];
    
    return headlines.map((item, index) => ({
      id: `forex-fallback-${index}`,
      headline: item.headline,
      source: item.source,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      sentiment: item.sentiment
    }));
  }
}

// ============================================================================
// UNIFIED NEWS SERVICE
// ============================================================================

export class NewsService {
  private static lastFetchTime: number = 0;
  private static cachedNews: NewsHeadline[] = [];
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Get all news with multiple sources (API keys enabled)
   */
  static async getAllNews(limit: number = 30): Promise<NewsHeadline[]> {
    const now = Date.now();
    
    // Return cached news if still valid
    if (now - this.lastFetchTime < this.CACHE_DURATION && this.cachedNews.length > 0) {
      return this.cachedNews.slice(0, limit);
    }
    
    try {
      // Fetch from multiple sources in parallel with API keys
      const [financial, crypto, newsData, finnhub] = await Promise.all([
        NewsAPIService.getHeadlines("business", 15),
        CryptoPanicService.getNews(10),
        NewsAPIService.getNewsFromNewsData("business", 15),
        NewsAPIService.getNewsFromFinnhub(10)
      ]);
      
      // Merge and sort by timestamp
      const allNews = [...financial, ...crypto, ...newsData, ...finnhub]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      this.cachedNews = allNews;
      this.lastFetchTime = now;
      
      return allNews;
    } catch (error) {
      console.error("Failed to fetch news:", error);
      return this.getFallbackNews();
    }
  }
  
  /**
   * Get news by category
   */
  static async getNewsByCategory(category: "general" | "crypto" | "forex" | "commodity" | "stock"): Promise<NewsHeadline[]> {
    switch (category) {
      case "crypto":
        const [cryptoPanic, cryptoNewsData] = await Promise.all([
          CryptoPanicService.getNews(15),
          NewsAPIService.getCryptoNewsFromNewsData(15)
        ]);
        return [...cryptoPanic, ...cryptoNewsData].sort((a, b) => b.timestamp - a.timestamp);
      case "forex":
        const [forexNews, forexNewsData] = await Promise.all([
          ForexNewsService.getNews(),
          NewsAPIService.getNewsFromNewsData("business", 20)
        ]);
        return [...forexNews, ...forexNewsData].sort((a, b) => b.timestamp - a.timestamp);
      case "stock":
        return NewsAPIService.getNewsFromFinnhub(30);
      default:
        return this.getAllNews(30);
    }
  }
  
  /**
   * Get market news from all sources
   */
  static async getMarketNews(limit: number = 30): Promise<NewsHeadline[]> {
    const [newsData, finnhub, newsDataCrypto] = await Promise.all([
      NewsAPIService.getNewsFromNewsData("business", 20),
      NewsAPIService.getMarketNewsFromFinnhub(20),
      NewsAPIService.getNewsFromNewsData("economy", 15)
    ]);
    
    return [...newsData, ...finnhub, ...newsDataCrypto]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  /**
   * Search news
   */
  static async searchNews(query: string, limit: number = 20): Promise<NewsHeadline[]> {
    return NewsAPIService.searchNews(query, limit);
  }
  
  /**
   * Get economic calendar
   */
  static async getEconomicCalendar() {
    return ForexNewsService.getEconomicCalendar();
  }
  
  /**
   * Get market sentiment from news
   */
  static async getNewsSentiment(): Promise<{
    overall: number;
    bullish: number;
    bearish: number;
    neutral: number;
    topStories: NewsHeadline[];
  }> {
    const news = await this.getAllNews(50);
    
    const bullish = news.filter(n => n.sentiment > 0.2).length;
    const bearish = news.filter(n => n.sentiment < -0.2).length;
    const neutral = news.length - bullish - bearish;
    const overall = news.reduce((sum, n) => sum + n.sentiment, 0) / news.length;
    
    return {
      overall: Math.round(overall * 100) / 100,
      bullish,
      bearish,
      neutral,
      topStories: news.slice(0, 5)
    };
  }
  
  /**
   * Fallback news when all APIs fail
   */
  private static getFallbackNews(): NewsHeadline[] {
    const headlines = [
      { source: "Bloomberg", headline: "Fed signals potential rate cuts later this year", sentiment: 0.3 },
      { source: "Reuters", headline: "Global markets rally on strong earnings", sentiment: 0.5 },
      { source: "CNBC", headline: "Tech stocks lead market higher", sentiment: 0.4 },
      { source: "CoinDesk", headline: "Bitcoin and crypto markets show continued momentum", sentiment: 0.3 },
      { source: "Financial Times", headline: "European markets end mixed", sentiment: 0 },
      { source: "WSJ", headline: "Oil prices stabilize amid geopolitical concerns", sentiment: 0.1 },
      { source: "Bloomberg", headline: "Gold prices retreat from highs", sentiment: -0.2 },
      { source: "Reuters", headline: "Asian markets close lower", sentiment: -0.1 },
      { source: "CNBC", headline: "Ethereum upgrade completed successfully", sentiment: 0.4 },
      { source: "Financial Times", headline: "Bank earnings exceed expectations", sentiment: 0.3 }
    ];
    
    return headlines.map((item, index) => ({
      id: `fallback-${Date.now()}-${index}`,
      headline: item.headline,
      source: item.source,
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      sentiment: item.sentiment
    }));
  }
}

// ============================================================================
// SENTIMENT AGGREGATOR
// ============================================================================

export class SentimentAggregator {
  
  /**
   * Calculate overall market sentiment from multiple sources
   */
  static async getMarketSentiment(): Promise<{
    score: number;
    label: "Bullish" | "Bearish" | "Neutral";
    confidence: number;
    sources: { name: string; score: number }[];
  }> {
    try {
      const newsSentiment = await NewsService.getNewsSentiment();
      const newsScore = newsSentiment.overall;
      
      // Add more sources here (social media, etc.)
      const sources = [
        { name: "News", score: newsScore },
        { name: "Crypto Fear & Greed Index", score: 0.6 }, // Simulated
        { name: "Market Mood", score: 0.5 }  // Simulated
      ];
      
      const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length;
      
      let label: "Bullish" | "Bearish" | "Neutral";
      let confidence: number;
      
      if (avgScore > 0.2) {
        label = "Bullish";
        confidence = Math.min(Math.abs(avgScore) * 100 + 50, 95);
      } else if (avgScore < -0.2) {
        label = "Bearish";
        confidence = Math.min(Math.abs(avgScore) * 100 + 50, 95);
      } else {
        label = "Neutral";
        confidence = 50 + (1 - Math.abs(avgScore)) * 30;
      }
      
      return {
        score: Math.round(avgScore * 100) / 100,
        label,
        confidence: Math.round(confidence),
        sources
      };
    } catch (error) {
      return {
        score: 0,
        label: "Neutral",
        confidence: 50,
        sources: [{ name: "News", score: 0 }]
      };
    }
  }
  
  /**
   * Get sentiment for specific symbol
   */
  static async getSymbolSentiment(symbol: string): Promise<{
    score: number;
    label: "Bullish" | "Bearish" | "Neutral";
    news: NewsHeadline[];
  }> {
    // Search for symbol-specific news
    const news = await NewsService.searchNews(symbol, 10);
    const score = news.length > 0 
      ? news.reduce((sum, n) => sum + n.sentiment, 0) / news.length 
      : 0;
    
    let label: "Bullish" | "Bearish" | "Neutral";
    if (score > 0.2) label = "Bullish";
    else if (score < -0.2) label = "Bearish";
    else label = "Neutral";
    
    return {
      score: Math.round(score * 100) / 100,
      label,
      news
    };
  }
}
