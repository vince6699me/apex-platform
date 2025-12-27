
import { OHLCV, Quote, WatchlistItem, Position, NewsHeadline } from "../types";
import { TechnicalIndicatorService } from "./technicalIndicators";

export class MarketDataService {
  private static symbols = ["AAPL", "TSLA", "MSFT", "NVDA", "GOOGL", "AMZN", "META"];
  private static companyNames: Record<string, string> = {
    AAPL: "Apple Inc.", TSLA: "Tesla Inc.", MSFT: "Microsoft Corp.",
    NVDA: "NVIDIA Corp.", GOOGL: "Alphabet Inc.", AMZN: "Amazon.com Inc.", META: "Meta Platforms Inc.",
  };

  static generateHistoricalData(symbol: string, days: number = 500, basePrice: number = 100): OHLCV[] {
    const data: OHLCV[] = [];
    let price = basePrice;
    for (let i = days; i >= 0; i--) {
      const timestamp = Date.now() - i * 86400000;
      const change = price * (0.0005 + 0.02 * (Math.random() - 0.5));
      const open = price;
      price += change;
      const high = Math.max(open, price) * (1 + Math.random() * 0.01);
      const low = Math.min(open, price) * (1 - Math.random() * 0.01);
      data.push({ timestamp, open, high, low, close: price, volume: Math.floor(Math.random() * 50000000 + 10000000) });
    }
    return data;
  }

  static generateQuote(symbol: string, historicalData?: OHLCV[]): Quote {
    const data = historicalData || this.generateHistoricalData(symbol, 30, 100 + Math.random() * 400);
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = latest.close - previous.close;
    return {
      symbol,
      price: latest.close,
      change,
      changePercent: (change / previous.close) * 100,
      volume: this.formatVolume(latest.volume),
      high: latest.high,
      low: latest.low,
      open: latest.open,
      previousClose: previous.close,
      timestamp: latest.timestamp,
    };
  }

  static getTrendingSymbols(): Quote[] {
    // Return top 5 symbols with simulated live data
    return this.symbols.slice(0, 5).map(s => this.generateQuote(s));
  }

  static searchSymbols(query: string): WatchlistItem[] {
    if (!query) return [];
    const all = this.generateWatchlist();
    return all.filter(s =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  static generateWatchlist(): WatchlistItem[] {
    return this.symbols.map((symbol) => {
      const historicalData = this.generateHistoricalData(symbol, 30, 100 + Math.random() * 400);
      const quote = this.generateQuote(symbol, historicalData);
      const prices = historicalData.map((d) => d.close);
      const rsi = TechnicalIndicatorService.calculateRSI(prices);
      const macdResults = TechnicalIndicatorService.calculateMACD(prices);
      const latestMACD = macdResults[macdResults.length - 1];
      let macdSignal: "Bullish" | "Bearish" | "Neutral" = "Neutral";
      if (latestMACD) {
        if (latestMACD.histogram > 0 && latestMACD.macd > latestMACD.signal) macdSignal = "Bullish";
        else if (latestMACD.histogram < 0 && latestMACD.macd < latestMACD.signal) macdSignal = "Bearish";
      }
      const sma50 = TechnicalIndicatorService.calculateSMA(prices, 50);
      const ema20 = TechnicalIndicatorService.calculateEMA(prices, 20);
      return {
        ...quote,
        name: this.companyNames[symbol] || symbol,
        rsi,
        macd: macdSignal,
        sma50: sma50[sma50.length - 1]?.value || quote.price,
        ema20: ema20[ema20.length - 1]?.value || quote.price,
      };
    });
  }

  static generatePositions(): Position[] {
    const positions: Position[] = [
      { symbol: "AAPL", shares: 50, avgCost: 175.5, currentPrice: 178.25, value: 0, pnl: 0, pnlPercent: 0, allocation: 0 },
      { symbol: "TSLA", shares: 25, avgCost: 248.0, currentPrice: 242.84, value: 0, pnl: 0, pnlPercent: 0, allocation: 0 },
      { symbol: "MSFT", shares: 75, avgCost: 395.2, currentPrice: 405.8, value: 0, pnl: 0, pnlPercent: 0, allocation: 0 },
      { symbol: "NVDA", shares: 30, avgCost: 480.0, currentPrice: 495.22, value: 0, pnl: 0, pnlPercent: 0, allocation: 0 },
    ];
    let totalValue = 0;
    positions.forEach((pos) => {
      pos.value = pos.shares * pos.currentPrice;
      pos.pnl = pos.value - pos.shares * pos.avgCost;
      pos.pnlPercent = (pos.pnl / (pos.shares * pos.avgCost)) * 100;
      totalValue += pos.value;
    });
    positions.forEach((pos) => { pos.allocation = (pos.value / totalValue) * 100; });
    return positions;
  }

  private static formatVolume(volume: number): string {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  }

  static generatePortfolioPerformance(days: number = 30): { date: string; value: number }[] {
    const data = [];
    let value = 100000;
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      value += value * (Math.random() * 0.02 - 0.005);
      data.push({ date: i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }), value: Math.round(value) });
    }
    return data;
  }

  static generateMarketNews(): NewsHeadline[] {
    const sources = ["Bloomberg", "Reuters", "CNBC", "Financial Times", "WSJ"];
    const sentiments = [-0.8, -0.4, 0, 0.4, 0.8];
    const headlines = [
      "Fed signals potential rate cuts later this year",
      "Tech sector rallies on new AI breakthroughs",
      "Oil prices stabilize amidst geopolitical tensions",
      "Consumer spending shows resilience in latest report",
      "Global supply chain issues persist, affecting manufacturing"
    ];

    return headlines.map((headline, i) => ({
      id: `news-${i}`,
      headline,
      source: sources[i % sources.length],
      timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      sentiment: sentiments[i % sentiments.length]
    }));
  }
}
