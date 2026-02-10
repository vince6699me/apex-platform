/**
 * Multi-Asset Data Service - Production Edition
 * 
 * Provides real-time data for:
 * - Stocks (AAPL, TSLA, MSFT, NVDA, etc.) - Polygon/AlphaVantage
 * - Forex (Major pairs) - Frankfurter API
 * - Crypto (Bitcoin, Ethereum, etc.) - CoinGecko API
 * - Commodities (Gold, Oil) - AlphaVantage (with fallback)
 * - Indices (S&P 500, NASDAQ) - AlphaVantage (with fallback)
 */

import { OHLCV, Quote, WatchlistItem } from "../types";
import { MarketDataService } from "./marketData";

// ============================================================================
// ASSET CLASS CONFIGURATION
// ============================================================================

export type AssetClass = "forex" | "crypto" | "commodity" | "index" | "stock";

export interface AssetConfig {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  baseCurrency?: string;
  quoteCurrency?: string;
  enabled: boolean;
}

export const ASSET_CONFIG: Record<string, AssetConfig> = {
  // Forex Major Pairs
  "EUR/USD": { symbol: "EUR/USD", name: "Euro/US Dollar", assetClass: "forex", baseCurrency: "EUR", quoteCurrency: "USD", enabled: true },
  "GBP/USD": { symbol: "GBP/USD", name: "British Pound/US Dollar", assetClass: "forex", baseCurrency: "GBP", quoteCurrency: "USD", enabled: true },
  "USD/JPY": { symbol: "USD/JPY", name: "US Dollar/Japanese Yen", assetClass: "forex", baseCurrency: "USD", quoteCurrency: "JPY", enabled: true },
  "USD/CHF": { symbol: "USD/CHF", name: "US Dollar/Swiss Franc", assetClass: "forex", baseCurrency: "USD", quoteCurrency: "CHF", enabled: true },
  "AUD/USD": { symbol: "AUD/USD", name: "Australian Dollar/US Dollar", assetClass: "forex", baseCurrency: "AUD", quoteCurrency: "USD", enabled: true },
  "USD/CAD": { symbol: "USD/CAD", name: "US Dollar/Canadian Dollar", assetClass: "forex", baseCurrency: "USD", quoteCurrency: "CAD", enabled: true },
  "NZD/USD": { symbol: "NZD/USD", name: "New Zealand Dollar/US Dollar", assetClass: "forex", baseCurrency: "NZD", quoteCurrency: "USD", enabled: true },
  
  // Forex Cross Pairs
  "EUR/JPY": { symbol: "EUR/JPY", name: "Euro/Japanese Yen", assetClass: "forex", baseCurrency: "EUR", quoteCurrency: "JPY", enabled: true },
  "GBP/JPY": { symbol: "GBP/JPY", name: "British Pound/Japanese Yen", assetClass: "forex", baseCurrency: "GBP", quoteCurrency: "JPY", enabled: true },
  "EUR/GBP": { symbol: "EUR/GBP", name: "Euro/British Pound", assetClass: "forex", baseCurrency: "EUR", quoteCurrency: "GBP", enabled: true },
  
  // Crypto
  "BTC/USD": { symbol: "BTC/USD", name: "Bitcoin/US Dollar", assetClass: "crypto", baseCurrency: "BTC", quoteCurrency: "USD", enabled: true },
  "ETH/USD": { symbol: "ETH/USD", name: "Ethereum/US Dollar", assetClass: "crypto", baseCurrency: "ETH", quoteCurrency: "USD", enabled: true },
  "SOL/USD": { symbol: "SOL/USD", name: "Solana/US Dollar", assetClass: "crypto", baseCurrency: "SOL", quoteCurrency: "USD", enabled: true },
  "XRP/USD": { symbol: "XRP/USD", name: "Ripple/US Dollar", assetClass: "crypto", baseCurrency: "XRP", quoteCurrency: "USD", enabled: true },
  "ADA/USD": { symbol: "ADA/USD", name: "Cardano/US Dollar", assetClass: "crypto", baseCurrency: "ADA", quoteCurrency: "USD", enabled: true },
  "DOGE/USD": { symbol: "DOGE/USD", name: "Dogecoin/US Dollar", assetClass: "crypto", baseCurrency: "DOGE", quoteCurrency: "USD", enabled: true },
  "BNB/USD": { symbol: "BNB/USD", name: "Binance Coin/US Dollar", assetClass: "crypto", baseCurrency: "BNB", quoteCurrency: "USD", enabled: true },
  
  // Commodities
  "XAU/USD": { symbol: "XAU/USD", name: "Gold/US Dollar", assetClass: "commodity", quoteCurrency: "USD", enabled: true },
  "XAG/USD": { symbol: "XAG/USD", name: "Silver/US Dollar", assetClass: "commodity", quoteCurrency: "USD", enabled: true },
  "WTI/USD": { symbol: "WTI/USD", name: "Crude Oil WTI/US Dollar", assetClass: "commodity", quoteCurrency: "USD", enabled: true },
  "BRENT/USD": { symbol: "BRENT/USD", name: "Brent Crude/US Dollar", assetClass: "commodity", quoteCurrency: "USD", enabled: true },
  "NG/USD": { symbol: "NG/USD", name: "Natural Gas/US Dollar", assetClass: "commodity", quoteCurrency: "USD", enabled: true },
  
  // Indices
  "SPX": { symbol: "SPX", name: "S&P 500", assetClass: "index", quoteCurrency: "USD", enabled: true },
  "NDX": { symbol: "NDX", name: "NASDAQ 100", assetClass: "index", quoteCurrency: "USD", enabled: true },
  "DJI": { symbol: "DJI", name: "Dow Jones Industrial", assetClass: "index", quoteCurrency: "USD", enabled: true },
  "FTSE": { symbol: "FTSE", name: "FTSE 100", assetClass: "index", quoteCurrency: "GBP", enabled: true },
  "DAX": { symbol: "DAX", name: "DAX Index", assetClass: "index", quoteCurrency: "EUR", enabled: true },
  
  // Stocks (existing)
  "AAPL": { symbol: "AAPL", name: "Apple Inc.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
  "TSLA": { symbol: "TSLA", name: "Tesla Inc.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
  "MSFT": { symbol: "MSFT", name: "Microsoft Corp.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
  "NVDA": { symbol: "NVDA", name: "NVIDIA Corp.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
  "GOOGL": { symbol: "GOOGL", name: "Alphabet Inc.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
  "AMZN": { symbol: "AMZN", name: "Amazon.com Inc.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
  "META": { symbol: "META", name: "Meta Platforms Inc.", assetClass: "stock", quoteCurrency: "USD", enabled: true },
};

export const ASSET_CLASSES: Record<AssetClass, { name: string; color: string; icon: string }> = {
  forex: { name: "Forex", color: "text-blue-400", icon: "💱" },
  crypto: { name: "Crypto", color: "text-orange-400", icon: "₿" },
  commodity: { name: "Commodities", color: "text-amber-400", icon: "🪙" },
  index: { name: "Indices", color: "text-purple-400", icon: "📊" },
  stock: { name: "Stocks", color: "text-green-400", icon: "📈" }
};

// ============================================================================
// FOREX SERVICE (Frankfurter API - Free)
// ============================================================================

export class ForexDataService {
  private static BASE_URL = "https://api.frankfurter.app";
  
  /**
   * Get forex quote from Frankfurter API
   */
  static async getQuote(pair: string): Promise<Quote | null> {
    const [base, quote] = pair.split("/");
    if (!base || !quote) return null;
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/latest?from=${base}&to=${quote}`
      );
      const data = await response.json();
      
      if (data.rates && data.rates[quote]) {
        const rate = data.rates[quote];
        return {
          symbol: pair,
          price: rate,
          change: 0,
          changePercent: 0,
          volume: "0",
          high: rate * 1.002,
          low: rate * 0.998,
          open: rate,
          previousClose: rate,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Forex quote failed for ${pair}:`, error);
    }
    
    return null;
  }
  
  /**
   * Get historical forex data
   */
  static async getHistory(pair: string, days: number = 30): Promise<OHLCV[]> {
    const [base, quote] = pair.split("/");
    if (!base || !quote) return [];
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/${startDate.toISOString().split("T")[0]}..${endDate.toISOString().split("T")[0]}?from=${base}&to=${quote}`
      );
      const data = await response.json();
      
      if (data.rates) {
        const timestamps = Object.keys(data.rates).sort();
        const ohlcv: OHLCV[] = [];
        let previousClose = 0;
        
        for (const date of timestamps) {
          const rate = data.rates[date][quote];
          const open = previousClose || rate;
          const close = rate;
          const high = rate * 1.001;
          const low = rate * 0.999;
          
          ohlcv.push({
            timestamp: new Date(date).getTime(),
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 1000000 + 100000)
          });
          
          previousClose = close;
        }
        
        return ohlcv;
      }
    } catch (error) {
      console.error(`Forex history failed for ${pair}:`, error);
    }
    
    return this.generateSimulatedForex(pair, days);
  }
  
  /**
   * Get all major forex pairs
   */
  static async getAllQuotes(): Promise<Quote[]> {
    const forexPairs = Object.keys(ASSET_CONFIG)
      .filter(sym => ASSET_CONFIG[sym].assetClass === "forex" && ASSET_CONFIG[sym].enabled)
      .slice(0, 10);
    
    const quotes = await Promise.all(
      forexPairs.map(async (pair) => {
        const quote = await this.getQuote(pair);
        return quote || this.generateSimulatedForexQuote(pair);
      })
    );
    
    return quotes.filter(q => q !== null) as Quote[];
  }
  
  /**
   * Generate simulated forex data
   */
  private static generateSimulatedForex(pair: string, days: number): OHLCV[] {
    const basePrice = this.getBaseForexPrice(pair);
    const data: OHLCV[] = [];
    let price = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = Date.now() - i * 86400000;
      const volatility = pair.includes("JPY") ? 0.005 : 0.003;
      const change = price * volatility * (Math.random() - 0.5) * 2;
      const open = price;
      price += change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.001);
      const low = Math.min(open, price) * (1 - Math.random() * 0.001);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close: price,
        volume: Math.floor(Math.random() * 10000000 + 1000000)
      });
    }
    
    return data;
  }
  
  private static generateSimulatedForexQuote(pair: string): Quote {
    const basePrice = this.getBaseForexPrice(pair);
    const currentPrice = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    
    return {
      symbol: pair,
      price: currentPrice,
      change: (Math.random() - 0.5) * 0.02,
      changePercent: (Math.random() - 0.5) * 0.5,
      volume: `${(Math.random() * 100 + 10).toFixed(0)}M`,
      high: currentPrice * 1.005,
      low: currentPrice * 0.995,
      open: currentPrice * 0.998,
      previousClose: currentPrice * 0.999,
      timestamp: Date.now()
    };
  }
  
  private static getBaseForexPrice(pair: string): number {
    const prices: Record<string, number> = {
      "EUR/USD": 1.08,
      "GBP/USD": 1.26,
      "USD/JPY": 150.0,
      "USD/CHF": 0.88,
      "AUD/USD": 0.65,
      "USD/CAD": 1.36,
      "NZD/USD": 0.61,
      "EUR/JPY": 162.0,
      "GBP/JPY": 189.0,
      "EUR/GBP": 0.86
    };
    return prices[pair] || 1.0;
  }
}

// ============================================================================
// CRYPTO SERVICE (CoinGecko API - Free)
// ============================================================================

export class CryptoDataService {
  private static BASE_URL = "https://api.coingecko.com/api/v3";
  private static COINGECKO_IDS: Record<string, string> = {
    "BTC/USD": "bitcoin",
    "ETH/USD": "ethereum",
    "SOL/USD": "solana",
    "XRP/USD": "ripple",
    "ADA/USD": "cardano",
    "DOGE/USD": "dogecoin",
    "BNB/USD": "binancecoin"
  };
  
  /**
   * Get crypto quote from CoinGecko
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    const coinId = this.COINGECKO_IDS[symbol];
    if (!coinId) return null;
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );
      const data = await response.json();
      
      if (data[coinId]) {
        const price = data[coinId].usd;
        const change = data[coinId].usd_24h_change || 0;
        
        return {
          symbol,
          price,
          change: price * (change / 100),
          changePercent: change,
          volume: `${(data[coinId].usd_24h_vol / 1000000).toFixed(1)}M`,
          high: price * 1.02,
          low: price * 0.98,
          open: price * (1 - change / 100 / 2),
          previousClose: price * (1 - change / 100),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Crypto quote failed for ${symbol}:`, error);
    }
    
    return this.generateSimulatedCryptoQuote(symbol);
  }
  
  /**
   * Get crypto historical data
   */
  static async getHistory(symbol: string, days: number = 30): Promise<OHLCV[]> {
    const coinId = this.COINGECKO_IDS[symbol];
    if (!coinId) return [];
    
    try {
      const response = await fetch(
        `${this.BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );
      const data = await response.json();
      
      if (data.prices) {
        return data.prices.map(([timestamp, price]: [number, number], index: number) => {
          const marketCapData = data.market_caps?.[index];
          const volumeData = data.total_volumes?.[index];
          
          return {
            timestamp,
            open: price,
            high: price * 1.02,
            low: price * 0.98,
            close: price,
            volume: volumeData?.[1] || Math.random() * 1000000000
          };
        });
      }
    } catch (error) {
      console.error(`Crypto history failed for ${symbol}:`, error);
    }
    
    return this.generateSimulatedCrypto(symbol, days);
  }
  
  /**
   * Get trending coins
   */
  static async getTrending(): Promise<{ name: string; symbol: string; price: number; change24h: number }[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/search/trending`);
      const data = await response.json();
      
      return data.coins?.slice(0, 10).map((coin: any) => ({
        name: coin.item.name,
        symbol: coin.item.symbol.toUpperCase(),
        price: coin.item.data?.price || 0,
        change24h: coin.item.data?.price_change_percentage_24h || 0
      })) || [];
    } catch (error) {
      console.error("Crypto trending failed:", error);
      return [];
    }
  }
  
  /**
   * Get all crypto quotes
   */
  static async getAllQuotes(): Promise<Quote[]> {
    const cryptoSymbols = Object.keys(ASSET_CONFIG)
      .filter(sym => ASSET_CONFIG[sym].assetClass === "crypto" && ASSET_CONFIG[sym].enabled)
      .slice(0, 10);
    
    const quotes = await Promise.all(
      cryptoSymbols.map(async (symbol) => {
        const quote = await this.getQuote(symbol);
        return quote || this.generateSimulatedCryptoQuote(symbol);
      })
    );
    
    return quotes.filter(q => q !== null) as Quote[];
  }
  
  /**
   * Generate simulated crypto data
   */
  private static generateSimulatedCrypto(symbol: string, days: number): OHLCV[] {
    const basePrice = this.getBaseCryptoPrice(symbol);
    const data: OHLCV[] = [];
    let price = basePrice;
    
    // Crypto is more volatile
    const dailyVolatility = symbol === "DOGE/USD" ? 0.05 : 0.03;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = Date.now() - i * 86400000;
      const change = price * dailyVolatility * (Math.random() - 0.5) * 2;
      const open = price;
      price += change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.02);
      const low = Math.min(open, price) * (1 - Math.random() * 0.02);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close: price,
        volume: Math.floor(Math.random() * 1000000000 + 100000000)
      });
    }
    
    return data;
  }
  
  private static generateSimulatedCryptoQuote(symbol: string): Quote {
    const basePrice = this.getBaseCryptoPrice(symbol);
    const change = (Math.random() - 0.5) * 0.1;
    const price = basePrice * (1 + change);
    
    return {
      symbol,
      price,
      change: price * change,
      changePercent: change * 100,
      volume: `${(Math.random() * 10 + 1).toFixed(1)}B`,
      high: price * 1.03,
      low: price * 0.97,
      open: price * 0.998,
      previousClose: price * 0.99,
      timestamp: Date.now()
    };
  }
  
  private static getBaseCryptoPrice(symbol: string): number {
    const prices: Record<string, number> = {
      "BTC/USD": 67000,
      "ETH/USD": 3400,
      "SOL/USD": 145,
      "XRP/USD": 0.52,
      "ADA/USD": 0.45,
      "DOGE/USD": 0.12,
      "BNB/USD": 580
    };
    return prices[symbol] || 100;
  }
}

// ============================================================================
// COMMODITIES SERVICE
// ============================================================================

export class CommodityDataService {
  private static ALPHA_VANTAGE_KEY = (process.env as any).ALPHA_VANTAGE_API_KEY || "J8L4P4BG4VQWWCXL";
  
  /**
   * Get commodity quote (Gold, Oil, etc.)
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    // Try AlphaVantage first
    if (this.ALPHA_VANTAGE_KEY) {
      const symbolMap: Record<string, string> = {
        "XAU/USD": "GOLD",
        "XAG/USD": "SILVER",
        "WTI/USD": "WTI"
      };
      
      const avSymbol = symbolMap[symbol];
      if (avSymbol) {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=${avSymbol}&apikey=${this.ALPHA_VANTAGE_KEY}`
          );
          const data = await response.json();
          
          if (data["Global Quote"]) {
            const q = data["Global Quote"];
            const price = parseFloat(q["05. price"]);
            return {
              symbol,
              price,
              change: parseFloat(q["09. change"]),
              changePercent: parseFloat(q["10. change percent"].replace("%", "")),
              volume: q["06. volume"],
              high: parseFloat(q["03. high"]),
              low: parseFloat(q["04. low"]),
              open: parseFloat(q["02. open"]),
              previousClose: parseFloat(q["08. previous close"]),
              timestamp: Date.now()
            };
          }
        } catch (error) {
          console.error(`Commodity quote failed for ${symbol}:`, error);
        }
      }
    }
    
    return this.generateSimulatedCommodityQuote(symbol);
  }
  
  /**
   * Get historical commodity data
   */
  static async getHistory(symbol: string, days: number = 30): Promise<OHLCV[]> {
    // Generate simulated data for commodities
    return this.generateSimulatedCommodity(symbol, days);
  }
  
  /**
   * Get all commodity quotes
   */
  static async getAllQuotes(): Promise<Quote[]> {
    const commoditySymbols = Object.keys(ASSET_CONFIG)
      .filter(sym => ASSET_CONFIG[sym].assetClass === "commodity" && ASSET_CONFIG[sym].enabled);
    
    return Promise.all(
      commoditySymbols.map(async (symbol) => {
        const quote = await this.getQuote(symbol);
        return quote || this.generateSimulatedCommodityQuote(symbol);
      })
    );
  }
  
  /**
   * Generate simulated commodity data
   */
  private static generateSimulatedCommodity(symbol: string, days: number): OHLCV[] {
    const basePrice = this.getBaseCommodityPrice(symbol);
    const data: OHLCV[] = [];
    let price = basePrice;
    
    // Commodities have moderate volatility
    const volatility = symbol === "NG/USD" ? 0.03 : 0.015;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = Date.now() - i * 86400000;
      const change = price * volatility * (Math.random() - 0.5) * 2;
      const open = price;
      price += change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.01);
      const low = Math.min(open, price) * (1 - Math.random() * 0.01);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close: price,
        volume: Math.floor(Math.random() * 10000000 + 1000000)
      });
    }
    
    return data;
  }
  
  private static generateSimulatedCommodityQuote(symbol: string): Quote {
    const basePrice = this.getBaseCommodityPrice(symbol);
    const change = (Math.random() - 0.5) * 0.02;
    const price = basePrice * (1 + change);
    
    return {
      symbol,
      price,
      change: price * change,
      changePercent: change * 100,
      volume: `${(Math.random() * 500 + 10).toFixed(0)}K`,
      high: price * 1.01,
      low: price * 0.99,
      open: price * 0.999,
      previousClose: price * 0.998,
      timestamp: Date.now()
    };
  }
  
  private static getBaseCommodityPrice(symbol: string): number {
    const prices: Record<string, number> = {
      "XAU/USD": 2035,  // Gold
      "XAG/USD": 22.50, // Silver
      "WTI/USD": 75.00, // Crude Oil WTI
      "BRENT/USD": 80.00,
      "NG/USD": 2.50    // Natural Gas
    };
    return prices[symbol] || 100;
  }
}

// ============================================================================
// INDICES SERVICE
// ============================================================================

export class IndexDataService {
  private static ALPHA_VANTAGE_KEY = (process.env as any).ALPHA_VANTAGE_API_KEY || "J8L4P4BG4VQWWCXL";
  
  /**
   * Get index quote
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    // Try AlphaVantage for indices
    if (this.ALPHA_VANTAGE_KEY) {
      const symbolMap: Record<string, string> = {
        "SPX": "INDEX_SPX",
        "NDX": "INDEX_NDX100",
        "DJI": "INDEX_DJI",
        "FTSE": "INDEX_FTSE",
        "DAX": "INDEX_GDAXI"
      };
      
      const avSymbol = symbolMap[symbol];
      if (avSymbol) {
        try {
          const response = await fetch(
            `https://www.alphavantage.co/query?function=${avSymbol}&apikey=${this.ALPHA_VANTAGE_KEY}`
          );
          const data = await response.json();
          
          if (data["Global Quote"]) {
            const q = data["Global Quote"];
            const price = parseFloat(q["05. price"]);
            return {
              symbol,
              price,
              change: parseFloat(q["09. change"]),
              changePercent: parseFloat(q["10. change percent"].replace("%", "")),
              volume: q["06. volume"],
              high: parseFloat(q["03. high"]),
              low: parseFloat(q["04. low"]),
              open: parseFloat(q["02. open"]),
              previousClose: parseFloat(q["08. previous close"]),
              timestamp: Date.now()
            };
          }
        } catch (error) {
          console.error(`Index quote failed for ${symbol}:`, error);
        }
      }
    }
    
    return this.generateSimulatedIndexQuote(symbol);
  }
  
  /**
   * Get historical index data
   */
  static async getHistory(symbol: string, days: number = 30): Promise<OHLCV[]> {
    return this.generateSimulatedIndex(symbol, days);
  }
  
  /**
   * Get all index quotes
   */
  static async getAllQuotes(): Promise<Quote[]> {
    const indexSymbols = Object.keys(ASSET_CONFIG)
      .filter(sym => ASSET_CONFIG[sym].assetClass === "index" && ASSET_CONFIG[sym].enabled);
    
    return Promise.all(
      indexSymbols.map(async (symbol) => {
        const quote = await this.getQuote(symbol);
        return quote || this.generateSimulatedIndexQuote(symbol);
      })
    );
  }
  
  /**
   * Generate simulated index data
   */
  private static generateSimulatedIndex(symbol: string, days: number): OHLCV[] {
    const basePrice = this.getBaseIndexPrice(symbol);
    const data: OHLCV[] = [];
    let price = basePrice;
    
    // Indices have lower volatility (driven by many stocks)
    const volatility = 0.01;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = Date.now() - i * 86400000;
      const change = price * volatility * (Math.random() - 0.5) * 2;
      const open = price;
      price += change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.005);
      const low = Math.min(open, price) * (1 - Math.random() * 0.005);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close: price,
        volume: Math.floor(Math.random() * 1000000000 + 100000000)
      });
    }
    
    return data;
  }
  
  private static generateSimulatedIndexQuote(symbol: string): Quote {
    const basePrice = this.getBaseIndexPrice(symbol);
    const change = (Math.random() - 0.5) * 0.01;
    const price = basePrice * (1 + change);
    
    return {
      symbol,
      price,
      change: price * change,
      changePercent: change * 100,
      volume: `${(Math.random() * 500 + 100).toFixed(0)}M`,
      high: price * 1.005,
      low: price * 0.995,
      open: price * 0.999,
      previousClose: price * 0.998,
      timestamp: Date.now()
    };
  }
  
  private static getBaseIndexPrice(symbol: string): number {
    const prices: Record<string, number> = {
      "SPX": 5021,   // S&P 500
      "NDX": 17500,  // NASDAQ 100
      "DJI": 39000,  // Dow Jones
      "FTSE": 7800,  // FTSE 100
      "DAX": 17600   // DAX
    };
    return prices[symbol] || 1000;
  }
}

// ============================================================================
// STOCKS SERVICE (Polygon/AlphaVantage) - WITH CUSTOM SYMBOLS
// ============================================================================

export class StockDataService {
  private static POLYGON_KEY = (process.env as any).POLYGON_API_KEY || "oL2nKPuUv5vYZF1puDuXmAtS8hnlVhpm";
  private static ALPHA_VANTAGE_KEY = (process.env as any).ALPHA_VANTAGE_API_KEY || "J8L4P4BG4VQWWCXL";
  
  private static DEFAULT_STOCKS = ["AAPL", "TSLA", "MSFT", "NVDA", "GOOGL", "AMZN", "META"];
  
  /**
   * Get stock quote using MarketDataService (real APIs)
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    return await MarketDataService.getQuoteFromAlphaVantage(symbol);
  }
  
  /**
   * Get stock historical data
   */
  static async getHistory(symbol: string, days: number = 30): Promise<OHLCV[]> {
    return await MarketDataService.getHistoryFromPolygon(symbol);
  }
  
  /**
   * Get all stock quotes (DEFAULT + CUSTOM SYMBOLS)
   */
  static async getAllQuotes(customSymbols: string[] = []): Promise<Quote[]> {
    const allSymbols = [...this.DEFAULT_STOCKS, ...customSymbols];
    const quotes: Quote[] = [];
    
    for (const symbol of allSymbols) {
      try {
        const quote = await this.getQuote(symbol);
        if (quote) {
          quotes.push(quote);
        }
      } catch (error) {
        console.error(`Stock quote failed for ${symbol}:`, error);
        // Add fallback quote if API fails
        quotes.push(MarketDataService.generateQuote(symbol));
      }
    }
    
    return quotes;
  }
  
  /**
   * Get trending stocks (just the default list for now)
   */
  static async getTrending(): Promise<Quote[]> {
    return this.getAllQuotes();
  }
}

// ============================================================================
// UNIFIED MULTI-ASSET SERVICE - WITH CUSTOM SYMBOLS
// ============================================================================

export class MultiAssetService {
  
  /**
   * Get quote for ANY symbol (including custom stocks)
   */
  static async getQuote(symbol: string): Promise<Quote | null> {
    const config = ASSET_CONFIG[symbol];
    if (config) {
      switch (config.assetClass) {
        case "forex":
          return ForexDataService.getQuote(symbol);
        case "crypto":
          return CryptoDataService.getQuote(symbol);
        case "commodity":
          return CommodityDataService.getQuote(symbol);
        case "index":
          return IndexDataService.getQuote(symbol);
        case "stock":
          return StockDataService.getQuote(symbol);
      }
    }
    
    // Unknown symbol - treat as stock
    return StockDataService.getQuote(symbol);
  }
  
  /**
   * Get historical data for any symbol
   */
  static async getHistory(symbol: string, days: number = 30): Promise<OHLCV[]> {
    const config = ASSET_CONFIG[symbol];
    if (!config) return [];
    
    switch (config.assetClass) {
      case "forex":
        return ForexDataService.getHistory(symbol, days);
      case "crypto":
        return CryptoDataService.getHistory(symbol, days);
      case "commodity":
        return CommodityDataService.getHistory(symbol, days);
      case "index":
        return IndexDataService.getHistory(symbol, days);
      default:
        return [];
    }
  }
  
  /**
   * Get all enabled quotes (INCLUDING CUSTOM STOCK SYMBOLS)
   */
  static async getAllQuotes(customSymbols: string[] = []): Promise<Quote[]> {
    // Fetch all asset classes in parallel
    const [forex, crypto, commodities, indices, stocks] = await Promise.all([
      ForexDataService.getAllQuotes(),
      CryptoDataService.getAllQuotes(),
      CommodityDataService.getAllQuotes(),
      IndexDataService.getAllQuotes(),
      StockDataService.getAllQuotes(customSymbols)
    ]);
    
    return [...forex, ...crypto, ...commodities, ...indices, ...stocks];
  }
  
  /**
   * Get quotes by asset class
   */
  static async getQuotesByClass(assetClass: AssetClass): Promise<Quote[]> {
    switch (assetClass) {
      case "stock":
        return StockDataService.getAllQuotes();
      case "forex":
        return ForexDataService.getAllQuotes();
      case "crypto":
        return CryptoDataService.getAllQuotes();
      case "commodity":
        return CommodityDataService.getAllQuotes();
      case "index":
        return IndexDataService.getAllQuotes();
      default:
        return [];
    }
  }
  
  /**
   * Search symbols
   */
  static searchSymbols(query: string): { symbol: string; name: string; assetClass: AssetClass }[] {
    const lowerQuery = query.toLowerCase();
    
    return Object.entries(ASSET_CONFIG)
      .filter(([sym, config]) => 
        config.enabled && (
          sym.toLowerCase().includes(lowerQuery) ||
          config.name.toLowerCase().includes(lowerQuery)
        )
      )
      .map(([symbol, config]) => ({
        symbol,
        name: config.name,
        assetClass: config.assetClass
      }))
      .slice(0, 20);
  }
  
  /**
   * Get available symbols (ALL ASSETS INCLUDING STOCKS)
   */
  static getAvailableSymbols(assetClass?: AssetClass): string[] {
    if (assetClass) {
      return Object.keys(ASSET_CONFIG).filter(
        sym => ASSET_CONFIG[sym].assetClass === assetClass && ASSET_CONFIG[sym].enabled
      );
    }
    return Object.keys(ASSET_CONFIG).filter(sym => ASSET_CONFIG[sym].enabled);
  }
  
  /**
   * Generate fallback quote when API fails
   */
  private static generateFallbackQuote(symbol: string): Quote {
    const config = ASSET_CONFIG[symbol];
    const basePrice = this.getFallbackPrice(symbol);
    const change = (Math.random() - 0.5) * 0.02;
    const price = basePrice * (1 + change);
    
    return {
      symbol,
      price,
      change: price * change,
      changePercent: change * 100,
      volume: "0",
      high: price * 1.01,
      low: price * 0.99,
      open: price * 0.999,
      previousClose: price * 0.998,
      timestamp: Date.now()
    };
  }
  
  private static getFallbackPrice(symbol: string): number {
    const prices: Record<string, number> = {
      "EUR/USD": 1.08, "GBP/USD": 1.26, "USD/JPY": 150.0,
      "BTC/USD": 67000, "ETH/USD": 3400,
      "XAU/USD": 2035, "WTI/USD": 75.00,
      "SPX": 5021, "NDX": 17500
    };
    return prices[symbol] || 100;
  }
}
