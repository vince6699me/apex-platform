
import { PatternScanResult, SentimentInsight, AnomalyAlert, SmartMoneyPattern, ConfluenceAnalysis, PrioritySignal } from "../types";

export class AIIntelligenceService {
  static getSmartMoneyPatterns(): SmartMoneyPattern[] {
    return [
      {
        id: "aapl-smc-1", symbol: "AAPL", concept: "Buy-Side Liquidity", bias: "Bearish", timeframe: "4h",
        confidence: 58.6, zone: "Premium zone", description: "Liquidity pool resting above recent highs attracting premium buyers", retested: "6:04:29 PM"
      },
      {
        id: "aapl-smc-2", symbol: "AAPL", concept: "Breaker Block", bias: "Bullish", timeframe: "1h",
        confidence: 60.7, zone: "Discount zone", description: "Failed order block flipped to support resistance pivot", retested: "5:49:29 PM"
      },
      {
        id: "tsla-smc-1", symbol: "TSLA", concept: "Fair Value Gap", bias: "Neutral", timeframe: "4h",
        confidence: 57.1, zone: "Equilibrium zone", description: "Gap between displacement legs highlights imbalance for mean reversion", retested: "6:04:29 PM"
      },
      {
        id: "tsla-smc-2", symbol: "TSLA", concept: "Breaker Block", bias: "Bullish", timeframe: "1d",
        confidence: 82.7, zone: "Discount zone", description: "Failed order block flipped to support resistance pivot", retested: "5:49:29 PM"
      },
      {
        id: "msft-smc-1", symbol: "MSFT", concept: "Breaker Block", bias: "Bullish", timeframe: "15m",
        confidence: 82.3, zone: "Premium zone", description: "Failed order block flipped to support resistance pivot", retested: "6:04:29 PM"
      },
      {
        id: "msft-smc-2", symbol: "MSFT", concept: "Silver Bullet", bias: "Bullish", timeframe: "1h",
        confidence: 71.4, zone: "Equilibrium zone", description: "Time-and-price window sets up algorithmic entry for expansion", retested: "5:49:29 PM"
      },
      {
        id: "msft-smc-3", symbol: "MSFT", concept: "Buy-Side Liquidity", bias: "Bullish", timeframe: "1h",
        confidence: 90.4, zone: "Premium zone", description: "Liquidity pool resting above recent highs attracting premium buyers", retested: "5:34:29 PM"
      },
      {
        id: "nvda-smc-1", symbol: "NVDA", concept: "Breaker Block", bias: "Neutral", timeframe: "4h",
        confidence: 57.6, zone: "Equilibrium zone", description: "Failed order block flipped to support resistance pivot", retested: "6:04:29 PM"
      },
      {
        id: "nvda-smc-2", symbol: "NVDA", concept: "Buy-Side Liquidity", bias: "Bullish", timeframe: "1d",
        confidence: 64.0, zone: "Equilibrium zone", description: "Liquidity pool resting above recent highs attracting premium buyers", retested: "5:49:29 PM"
      }
    ];
  }

  static scanPatterns(): PatternScanResult[] {
    return [
      { symbol: "AAPL", direction: "Neutral", score: 90, confidence: 75, patterns: ["DoubleTop", "DoubleBottom"], lastUpdated: "6:04:29 PM" },
      { symbol: "TSLA", direction: "Bearish", score: 97, confidence: 76.7, patterns: ["DoubleTop", "DoubleBottom", "HeadAndShoulders"], lastUpdated: "6:04:29 PM" },
      { symbol: "MSFT", direction: "Neutral", score: 90, confidence: 75, patterns: ["DoubleTop", "DoubleBottom"], lastUpdated: "6:04:29 PM" },
      { symbol: "NVDA", direction: "Bullish", score: 95, confidence: 80, patterns: ["MorningStar", "DoubleTop", "DoubleBottom"], lastUpdated: "6:04:29 PM" },
      { symbol: "GOOGL", direction: "Bearish", score: 92, confidence: 76.7, patterns: ["DoubleTop", "DoubleBottom", "HeadAndShoulders"], lastUpdated: "6:04:29 PM" },
      { symbol: "AMZN", direction: "Neutral", score: 90, confidence: 75, patterns: ["DoubleTop", "DoubleBottom"], lastUpdated: "6:04:29 PM" },
      { symbol: "META", direction: "Neutral", score: 90, confidence: 75, patterns: ["DoubleTop", "DoubleBottom"], lastUpdated: "6:04:29 PM" },
    ];
  }

  static getSentimentInsights(symbols?: string[]): SentimentInsight[] {
    const insights: SentimentInsight[] = [
      {
        symbol: "AAPL", name: "AAPL Inc", sentimentLabel: "Bullish", change: 0.32, signalCount: 3,
        signals: [
          { source: "AlphaWire", message: "AAPL gains institutional interest amid AI expansion", score: 0.18 },
          { source: "FinPulse", message: "AAPL gains institutional interest amid AI expansion", score: 0.44 }
        ]
      },
      {
        symbol: "TSLA", name: "TSLA Inc", sentimentLabel: "Bullish", change: 0.72, signalCount: 2,
        signals: [
          { source: "AlphaWire", message: "TSLA gains institutional interest amid AI expansion", score: 0.70 },
          { source: "FinPulse", message: "TSLA gains institutional interest amid AI expansion", score: 0.69 }
        ]
      },
      {
        symbol: "MSFT", name: "MSFT Inc", sentimentLabel: "Bullish", change: 0.27, signalCount: 2,
        signals: [
          { source: "AlphaWire", message: "MSFT gains institutional interest amid AI expansion", score: 0.17 },
          { source: "FinPulse", message: "MSFT gains institutional interest amid AI expansion", score: 0.41 }
        ]
      },
      {
        symbol: "NVDA", name: "NVDA Inc", sentimentLabel: "Bullish", change: 0.47, signalCount: 2,
        signals: [
          { source: "AlphaWire", message: "NVDA gains institutional interest amid AI expansion", score: 0.60 },
          { source: "FinPulse", message: "NVDA gains institutional interest amid AI expansion", score: 0.48 }
        ]
      },
      {
        symbol: "GOOGL", name: "GOOGL Inc", sentimentLabel: "Bearish", change: -0.82, signalCount: 2,
        signals: [
          { source: "AlphaWire", message: "GOOGL faces profit-taking as traders reassess valuations", score: -0.82 },
          { source: "FinPulse", message: "GOOGL faces profit-taking as traders reassess valuations", score: -0.90 }
        ]
      },
      {
        symbol: "AMZN", name: "AMZN Inc", sentimentLabel: "Bullish", change: 0.39, signalCount: 2,
        signals: [
          { source: "AlphaWire", message: "AMZN gains institutional interest amid AI expansion", score: 0.40 },
          { source: "FinPulse", message: "AMZN gains institutional interest amid AI expansion", score: 0.25 }
        ]
      },
      {
        symbol: "META", name: "META Inc", sentimentLabel: "Bearish", change: -1.00, signalCount: 2,
        signals: [
          { source: "AlphaWire", message: "META faces profit-taking as traders reassess valuations", score: -1.0 }
        ]
      }
    ];

    if (symbols && symbols.length > 0) {
      return insights.filter(i => symbols.includes(i.symbol));
    }
    return insights;
  }

  static detectAnomalies(symbols: string[] = ["AAPL"]): AnomalyAlert[] {
    return []; 
  }

  static getConfluenceAnalysis(symbol: string): ConfluenceAnalysis {
    return {
      symbol: symbol.toUpperCase(),
      spotPrice: 98.18,
      atr: 1.27,
      consensusScore: 88,
      technicalBias: {
        bias: "Bullish",
        rsiState: "Overbought",
        sma20: 96.68,
        sma50: 95.29,
        ema20: 97.02
      },
      aiPatternScan: {
        bias: "Bearish",
        score: 100,
        patterns: [
          { name: "DoubleTop", bias: "Bearish" },
          { name: "DoubleBottom", bias: "Bullish" },
          { name: "HeadAndShoulders", bias: "Bearish" }
        ]
      },
      summary: {
        sentiment: { bias: "Bullish", score: 0.32 },
        anomalies: 0,
        smcSetups: 3
      }
    };
  }

  static getPrioritySignals(): PrioritySignal[] {
    return [
      {
        id: "1",
        type: "Sentiment",
        title: "Bullish",
        edge: 66,
        description: "AAPL gains institutional interest amid AI expansion",
        subtitle: "Sentiment"
      },
      {
        id: "2",
        type: "Pattern",
        title: "AAPL",
        bias: "Bearish",
        edge: 100,
        description: "3 confluences detected",
        subtitle: "Bearish"
      },
      {
        id: "3",
        type: "SMC",
        title: "AAPL",
        edge: 80.2,
        description: "Time-and-price window sets up algorithmic entry for expansion",
        subtitle: "Silver Bullet"
      }
    ];
  }
}
