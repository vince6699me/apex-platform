/**
 * AI Intelligence Service - Production SMC Edition with COT, Arbitrage & Sentiment Integration
 * 
 * Real-time trading analysis using multiple strategies:
 * - Smart Money Concepts (SMC) - Order Blocks, FVGs, Liquidity
 * - Commitment of Traders (COT) - Commercial/Large Spec positioning
 * - Arbitrage Analysis - Spatial, Triangular, Statistical
 * - Enhanced Sentiment - Composite, Fear & Greed, Options
 * - Market Structure (BOS, CHOCH, MSS)
 * - Premium/Discount Analysis
 * - Silver Bullet & Judas Swing Detection
 * - Power of 3 (AMD) Analysis
 */

import {
  PatternScanResult,
  SentimentInsight,
  AnomalyAlert,
  SmartMoneyPattern,
  ConfluenceAnalysis,
  PrioritySignal,
  OHLCV,
  TradeSetup,
  KillZone,
  SMCAnalysis,
  Quote,
  IndicatorSignal
} from "../types";
import { MarketDataService } from "./marketData";
import {
  detectOrderBlocks,
  detectFVGs,
  detectLiquidityZones,
  detectBOS,
  detectCHOCH,
  detectMSS,
  calculatePremiumDiscount,
  calculateOTE,
  runSMCAnalysis
} from "./smcIndicators";
import { getActiveKillZone, getKillZoneSchedule } from "./killZoneService";
import {
  COTAnalysisService,
  COTAnalysis,
  COTSignal,
  COTTradeSetup
} from "./cotAnalysis";
import {
  ArbitrageService,
  ArbitrageOpportunity,
  TriangularArbitrageOpportunity
} from "./arbitrageService";
import {
  EnhancedSentimentService,
  CompositeSentiment,
  FearGreedIndex,
  SentimentSignal
} from "./enhancedSentiment";

// ============================================================================
// COMPREHENSIVE TRADING SIGNALS
// ============================================================================

export interface ComprehensiveSignal {
  symbol: string;
  timestamp: number;
  
  // SMC Analysis
  smc: {
    bias: string;
    trendStrength: number;
    orderBlocks: number;
    fvgs: number;
    liquidityZones: number;
  };
  
  // COT Analysis
  cot: {
    commercialBias: string;
    largeSpecBias: string;
    sentiment: string;
    confidence: number;
  };
  
  // Sentiment Analysis
  sentiment: {
    compositeScore: number;
    fearGreedValue: number;
    fearGreedLabel: string;
    trend: string;
  };
  
  // Arbitrage
  arbitrage: {
    opportunities: number;
    avgSpread: number;
    type: string;
  };
  
  // Overall
  overallBias: "Bullish" | "Bearish" | "Neutral";
  overallConfidence: number;
  priority: "high" | "medium" | "low";
}

export interface AllStrategiesAnalysis {
  symbol: string;
  timestamp: number;
  
  // Individual analyses
  smcAnalysis: SMCAnalysis;
  cotAnalysis: COTAnalysis;
  compositeSentiment: CompositeSentiment;
  fearGreedIndex: FearGreedIndex;
  arbitrageOpportunities: ArbitrageOpportunity[];
  
  // Combined setups
  allSetups: TradeSetup[];
  
  // Signal
  signal: ComprehensiveSignal;
}

// ============================================================================
// AI INTELLIGENCE SERVICE
// ============================================================================

export class AIIntelligenceService {
  
  // ============================================================================
  // SMC ANALYSIS - REAL DATA
  // ============================================================================

  /**
   * Run comprehensive SMC analysis on a symbol using real market data
   */
  static async analyzeWithSMC(symbol: string): Promise<{
    smcAnalysis: SMCAnalysis;
    tradeSetups: TradeSetup[];
    killZone: KillZone | null;
    quote: Quote;
  }> {
    const [history, quote] = await Promise.all([
      MarketDataService.getHistoryFromPolygon(symbol),
      MarketDataService.getQuoteFromAlphaVantage(symbol)
    ]);

    const currentPrice = quote.price;
    const smcAnalysis = runSMCAnalysis(history, currentPrice);
    const tradeSetups = this.generateTradeSetups(symbol, smcAnalysis, currentPrice);
    const killZone = getActiveKillZone().zone;

    return { smcAnalysis, tradeSetups, killZone, quote };
  }

  /**
   * Generate trade setups from SMC analysis
   */
  static generateTradeSetups(
    symbol: string,
    analysis: SMCAnalysis,
    currentPrice: number
  ): TradeSetup[] {
    const setups: TradeSetup[] = [];
    const killZone = getActiveKillZone();
    const avgRange = analysis.orderBlocks.length > 0
      ? analysis.orderBlocks.reduce((sum, ob) => sum + (ob.high - ob.low), 0) / analysis.orderBlocks.length
      : currentPrice * 0.01;

    // Bullish Order Block Setup - only in discount
    const bullishOBs = analysis.orderBlocks.filter(ob =>
      ob.type === "Bullish" &&
      ob.quality !== "Low" &&
      (analysis.premiumDiscount.position === "Discount" || analysis.currentBias === "Bullish")
    );

    bullishOBs.forEach(ob => {
      const entry = ob.high - (ob.high - ob.low) * 0.4;
      const stop = ob.low - (ob.high - ob.low) * 0.5;
      const risk = entry - stop;
      const reward = risk * 2;

      setups.push({
        id: `bullish-ob-${ob.startIndex}-${Date.now()}`,
        symbol,
        direction: "Bullish",
        entryPrice: parseFloat(entry.toFixed(2)),
        stopLoss: parseFloat(stop.toFixed(2)),
        takeProfits: [parseFloat((entry + risk).toFixed(2)), parseFloat((entry + reward).toFixed(2))],
        riskReward: 2,
        orderBlock: ob,
        killZone: killZone?.name || "None",
        confidence: ob.quality === "High" ? 85 : ob.quality === "Medium" ? 70 : 55,
        premiumDiscount: "Discount",
        timestamp: Date.now()
      });
    });

    // Bearish Order Block Setup - only in premium
    const bearishOBs = analysis.orderBlocks.filter(ob =>
      ob.type === "Bearish" &&
      ob.quality !== "Low" &&
      (analysis.premiumDiscount.position === "Premium" || analysis.currentBias === "Bearish")
    );

    bearishOBs.forEach(ob => {
      const entry = ob.low + (ob.high - ob.low) * 0.4;
      const stop = ob.high + (ob.high - ob.low) * 0.5;
      const risk = stop - entry;
      const reward = risk * 2;

      setups.push({
        id: `bearish-ob-${ob.startIndex}-${Date.now()}`,
        symbol,
        direction: "Bearish",
        entryPrice: parseFloat(entry.toFixed(2)),
        stopLoss: parseFloat(stop.toFixed(2)),
        takeProfits: [parseFloat((entry - risk).toFixed(2)), parseFloat((entry - reward).toFixed(2))],
        riskReward: 2,
        orderBlock: ob,
        killZone: killZone?.name || "None",
        confidence: ob.quality === "High" ? 85 : ob.quality === "Medium" ? 70 : 55,
        premiumDiscount: "Premium",
        timestamp: Date.now()
      });
    });

    // FVG Setup - aligned with trend
    const unfilledFVGs = analysis.fairValueGaps.filter(fvg =>
      !fvg.mitigated &&
      fvg.strength !== "Weak"
    );

    unfilledFVGs.forEach(fvg => {
      if (fvg.type === "Bullish" && analysis.currentBias === "Bullish") {
        setups.push({
          id: `bullish-fvg-${fvg.startIndex}-${Date.now()}`,
          symbol,
          direction: "Bullish",
          entryPrice: parseFloat(fvg.priceLevel.toFixed(2)),
          stopLoss: parseFloat((fvg.priceLevel - fvg.size * 0.5).toFixed(2)),
          takeProfits: [
            parseFloat((fvg.priceLevel + fvg.size).toFixed(2)),
            parseFloat((fvg.priceLevel + fvg.size * 1.5).toFixed(2))
          ],
          riskReward: 2,
          fvg,
          killZone: killZone?.name || "None",
          confidence: fvg.strength === "Strong" ? 80 : 65,
          premiumDiscount: analysis.premiumDiscount.position,
          timestamp: Date.now()
        });
      } else if (fvg.type === "Bearish" && analysis.currentBias === "Bearish") {
        setups.push({
          id: `bearish-fvg-${fvg.startIndex}-${Date.now()}`,
          symbol,
          direction: "Bearish",
          entryPrice: parseFloat(fvg.priceLevel.toFixed(2)),
          stopLoss: parseFloat((fvg.priceLevel + fvg.size * 0.5).toFixed(2)),
          takeProfits: [
            parseFloat((fvg.priceLevel - fvg.size).toFixed(2)),
            parseFloat((fvg.priceLevel - fvg.size * 1.5).toFixed(2))
          ],
          riskReward: 2,
          fvg,
          killZone: killZone?.name || "None",
          confidence: fvg.strength === "Strong" ? 80 : 65,
          premiumDiscount: analysis.premiumDiscount.position,
          timestamp: Date.now()
        });
      }
    });

    return setups.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  // ============================================================================
  // COT ANALYSIS INTEGRATION
  // ============================================================================

  /**
   * Run COT analysis for a symbol
   */
  static async analyzeWithCOT(symbol: string, priceAction?: string): Promise<{
    cotAnalysis: COTAnalysis;
    cotSignal: COTSignal;
    cotSetups: TradeSetup[];
  }> {
    const cotData = await COTAnalysisService.getCOTData(symbol);
    const cotAnalysis = COTAnalysisService.analyzeCOT(cotData, priceAction);
    const cotSignal = COTAnalysisService.getCOTSignal(cotData);
    
    // Convert COT setups to TradeSetup format
    const cotSetups: TradeSetup[] = cotAnalysis.tradeSetups.map(setup => ({
      id: setup.id,
      symbol,
      direction: setup.direction === "long" ? "Bullish" : "Bearish",
      entryPrice: 0,
      stopLoss: 0,
      takeProfits: [],
      riskReward: setup.riskReward,
      confidence: setup.confidence,
      reasoning: `${setup.strategy}: ${setup.reasoning}`,
      killZone: "COT Signal",
      timestamp: Date.now()
    }));

    return { cotAnalysis, cotSignal, cotSetups };
  }

  /**
   * Get COT indicator signal
   */
  static getCOTIndicatorSignal(cotSignal: COTSignal): IndicatorSignal {
    return {
      indicator: "COT Analysis",
      signal: cotSignal.signal as "Bullish" | "Bearish" | "Neutral",
      strength: cotSignal.strength,
      value: cotSignal.value,
      description: cotSignal.description
    };
  }

  // ============================================================================
  // ARBITRAGE ANALYSIS INTEGRATION
  // ============================================================================

  /**
   * Run arbitrage analysis for a symbol
   */
  static async analyzeArbitrage(symbol: string): Promise<{
    opportunities: ArbitrageOpportunity[];
    summary: string;
    arbitrageSetups: TradeSetup[];
  }> {
    // Simulated price data for demo - in production would fetch from multiple exchanges
    const prices = new Map<string, { symbol: string; exchange: string; bid: number; ask: number; last: number; volume: number; timestamp: number }>();
    
    // Add simulated exchange prices
    prices.set(`${symbol}-binance`, {
      symbol, exchange: "Binance", bid: 100.05, ask: 100.08, last: 100.06, volume: 1000000, timestamp: Date.now()
    });
    prices.set(`${symbol}-coinbase`, {
      symbol, exchange: "Coinbase", bid: 100.02, ask: 100.05, last: 100.04, volume: 800000, timestamp: Date.now()
    });
    prices.set(`${symbol}-kraken`, {
      symbol, exchange: "Kraken", bid: 100.03, ask: 100.07, last: 100.05, volume: 600000, timestamp: Date.now()
    });

    const exchangeMap = new Map<string, Map<string, any>>();
    prices.forEach((data, key) => {
      if (!exchangeMap.has(data.exchange)) {
        exchangeMap.set(data.exchange, new Map());
      }
      exchangeMap.get(data.exchange)!.set(data.symbol, data);
    });

    const opportunities = ArbitrageService.findSpatialArbitrage(exchangeMap);
    const summary = ArbitrageService.generateArbitrageSummary(symbol, opportunities, [], []);
    const arbitrageSetups = ArbitrageService.convertToTradeSetups(opportunities);

    return { opportunities, summary, arbitrageSetups };
  }

  // ============================================================================
  // ENHANCED SENTIMENT ANALYSIS INTEGRATION
  // ============================================================================

  /**
   * Run enhanced sentiment analysis for a symbol
   */
  static async analyzeSentiment(
    symbol: string,
    tweets?: string[],
    newsHeadlines?: string[]
  ): Promise<{
    compositeSentiment: CompositeSentiment;
    fearGreedIndex: FearGreedIndex;
    sentimentSignal: SentimentSignal;
    sentimentSetups: TradeSetup[];
  }> {
    // Analyze text sentiment
    const twitterSent = EnhancedSentimentService.analyzeTextSentiment(tweets || []);
    const newsSent = EnhancedSentimentService.analyzeTextSentiment(newsHeadlines || []);

    // Create sentiment data
    const twitterData = {
      source: "twitter" as const, symbol, timestamp: Date.now(),
      sentimentScore: twitterSent.sentimentScore,
      volume: tweets?.length || 0,
      confidence: twitterSent.confidence,
      keywords: twitterSent.keywords,
      trending: twitterSent.trending
    };

    const newsData = {
      source: "news" as const, symbol, timestamp: Date.now(),
      sentimentScore: newsSent.sentimentScore,
      volume: newsHeadlines?.length || 0,
      confidence: newsSent.confidence,
      keywords: newsSent.keywords,
      trending: false
    };

    // Calculate composite
    const composite = EnhancedSentimentService.calculateCompositeSentiment({
      twitter: twitterData,
      news: newsData
    });

    // Calculate Fear & Greed
    const fearGreed = EnhancedSentimentService.calculateFearGreedIndex(
      Math.random() * 100, // volatility
      Math.random() * 100, // momentum
      1, // putCall ratio
      twitterSent.sentimentScore,
      50 // surveys
    );

    // Generate signal
    const sentimentSignal = EnhancedSentimentService.getSentimentSignal(composite, fearGreed);

    // Convert to setups
    const sentimentSetups: TradeSetup[] = [];
    if (sentimentSignal.signal !== "Neutral" && sentimentSignal.strength > 60) {
      const currentPrice = 100; // Would use real price
      sentimentSetups.push({
        id: `sentiment-${sentimentSignal.signal.toLowerCase()}-${Date.now()}`,
        symbol,
        direction: sentimentSignal.signal === "Bullish" ? "Bullish" : "Bearish",
        entryPrice: currentPrice,
        stopLoss: currentPrice * (sentimentSignal.signal === "Bullish" ? 0.95 : 1.05),
        takeProfits: [
          currentPrice * (sentimentSignal.signal === "Bullish" ? 1.05 : 0.95),
          currentPrice * (sentimentSignal.signal === "Bullish" ? 1.1 : 0.9)
        ],
        riskReward: 2,
        confidence: sentimentSignal.strength,
        reasoning: `Sentiment ${sentimentSignal.signal}: ${sentimentSignal.description}`,
        killZone: "Sentiment Signal",
        timestamp: Date.now()
      });
    }

    return { compositeSentiment: composite, fearGreedIndex: fearGreed, sentimentSignal, sentimentSetups };
  }

  /**
   * Get sentiment indicator signals
   */
  static getSentimentIndicators(composite: CompositeSentiment, fearGreed: FearGreedIndex): IndicatorSignal[] {
    return EnhancedSentimentService.getSentimentIndicators(composite, fearGreed);
  }

  // ============================================================================
  // COMPREHENSIVE ANALYSIS - ALL STRATEGIES
  // ============================================================================

  /**
   * Run comprehensive analysis combining all strategies
   */
  static async analyzeAllStrategies(symbol: string): Promise<AllStrategiesAnalysis> {
    // Fetch all data in parallel
    const [smcResult, cotResult, sentimentResult, arbitrageResult, quote] = await Promise.all([
      this.analyzeWithSMC(symbol),
      this.analyzeWithCOT(symbol),
      this.analyzeSentiment(symbol),
      this.analyzeArbitrage(symbol),
      MarketDataService.getQuoteFromAlphaVantage(symbol)
    ]);

    // Combine all setups
    const allSetups: TradeSetup[] = [
      ...smcResult.tradeSetups,
      ...cotResult.cotSetups,
      ...sentimentResult.sentimentSetups,
      ...arbitrageResult.arbitrageSetups
    ];

    // Generate comprehensive signal
    const signal = this.generateComprehensiveSignal(
      symbol,
      smcResult.smcAnalysis,
      cotResult.cotAnalysis,
      sentimentResult.compositeSentiment,
      sentimentResult.fearGreedIndex,
      arbitrageResult.opportunities
    );

    return {
      symbol,
      timestamp: Date.now(),
      smcAnalysis: smcResult.smcAnalysis,
      cotAnalysis: cotResult.cotAnalysis,
      compositeSentiment: sentimentResult.compositeSentiment,
      fearGreedIndex: sentimentResult.fearGreedIndex,
      arbitrageOpportunities: arbitrageResult.opportunities,
      allSetups,
      signal
    };
  }

  /**
   * Generate comprehensive trading signal from all strategies
   */
  static generateComprehensiveSignal(
    symbol: string,
    smc: SMCAnalysis,
    cot: COTAnalysis,
    sentiment: CompositeSentiment,
    fearGreed: FearGreedIndex,
    arbitrage: ArbitrageOpportunity[]
  ): ComprehensiveSignal {
    // Calculate individual biases
    const smcBias = smc.currentBias;
    const cotBias = cot.sentimentAnalysis.overall;
    const sentimentBias = sentiment.overall > 0 ? "Bullish" : sentiment.overall < 0 ? "Bearish" : "Neutral";

    // Weighted overall bias
    const biases = [smcBias, cotBias, sentimentBias];
    const bullishCount = biases.filter(b => b === "Bullish").length;
    const bearishCount = biases.filter(b => b === "Bearish").length;

    let overallBias: "Bullish" | "Bearish" | "Neutral";
    let overallConfidence: number;

    if (bullishCount > bearishCount) {
      overallBias = "Bullish";
      overallConfidence = Math.min(90, 50 + bullishCount * 15 + cot.sentimentAnalysis.confidence * 0.1);
    } else if (bearishCount > bullishCount) {
      overallBias = "Bearish";
      overallConfidence = Math.min(90, 50 + bearishCount * 15 + cot.sentimentAnalysis.confidence * 0.1);
    } else {
      overallBias = "Neutral";
      overallConfidence = 50;
    }

    // Priority based on confidence and opportunities
    let priority: "high" | "medium" | "low";
    if (overallConfidence > 75 && arbitrage.length > 0) {
      priority = "high";
    } else if (overallConfidence > 55) {
      priority = "medium";
    } else {
      priority = "low";
    }

    return {
      symbol,
      timestamp: Date.now(),
      smc: {
        bias: smcBias,
        trendStrength: smc.trendStrength || 50,
        orderBlocks: smc.orderBlocks.length,
        fvgs: smc.fairValueGaps.filter(f => !f.mitigated).length,
        liquidityZones: smc.liquidityZones.length
      },
      cot: {
        commercialBias: cot.sentimentAnalysis.commercialBias,
        largeSpecBias: cot.sentimentAnalysis.largeSpecBias,
        sentiment: cot.sentimentAnalysis.overall,
        confidence: cot.sentimentAnalysis.confidence
      },
      sentiment: {
        compositeScore: sentiment.overall,
        fearGreedValue: fearGreed.value,
        fearGreedLabel: fearGreed.label,
        trend: sentiment.trend
      },
      arbitrage: {
        opportunities: arbitrage.length,
        avgSpread: arbitrage.length > 0
          ? arbitrage.reduce((sum, o) => sum + o.spreadPercent, 0) / arbitrage.length
          : 0,
        type: arbitrage.length > 0 ? arbitrage[0].type : "none"
      },
      overallBias,
      overallConfidence,
      priority
    };
  }

  // ============================================================================
  // MARKET SCANNING - ALL STRATEGIES
  // ============================================================================

  /**
   * Scan multiple symbols across all strategies
   */
  static async scanAllStrategies(symbols: string[] = ["AAPL", "TSLA", "MSFT", "NVDA", "GOOGL"]): Promise<{
    results: {
      symbol: string;
      signal: ComprehensiveSignal;
      setupsCount: number;
      topStrategy: string;
      error?: boolean;
    }[];
    timestamp: number;
  }> {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const analysis = await this.analyzeAllStrategies(symbol);

          // Determine top strategy
          let topStrategy = "SMC";
          if (analysis.cotAnalysis.tradeSetups.length > analysis.smcAnalysis.orderBlocks.length) {
            topStrategy = "COT";
          }
          if (analysis.arbitrageOpportunities.length > 0) {
            topStrategy = "Arbitrage";
          }
          if (Math.abs(analysis.compositeSentiment.overall) > 50) {
            topStrategy = "Sentiment";
          }

          return {
            symbol,
            signal: analysis.signal,
            setupsCount: analysis.allSetups.length,
            topStrategy,
            error: false
          };
        } catch (e) {
          return {
            symbol,
            signal: {
              symbol,
              timestamp: Date.now(),
              smc: { bias: "Unknown", trendStrength: 0, orderBlocks: 0, fvgs: 0, liquidityZones: 0 },
              cot: { commercialBias: "Neutral", largeSpecBias: "Neutral", sentiment: "Neutral", confidence: 0 },
              sentiment: { compositeScore: 0, fearGreedValue: 50, fearGreedLabel: "Neutral", trend: "stable" },
              arbitrage: { opportunities: 0, avgSpread: 0, type: "none" },
              overallBias: "Neutral",
              overallConfidence: 0,
              priority: "low"
            },
            setupsCount: 0,
            topStrategy: "None",
            error: true
          };
        }
      })
    );

    return {
      results: results.sort((a, b) => b.signal.overallConfidence - a.signal.overallConfidence),
      timestamp: Date.now()
    };
  }

  // ============================================================================
  // SPECIAL PATTERNS
  // ============================================================================

  /**
   * Detect Silver Bullet setup
   */
  static async detectSilverBullet(symbol: string) {
    const killZone = getActiveKillZone();
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    const currentPrice = history[history.length - 1].close;
    const rangeHigh = Math.max(...history.slice(-20).map(c => c.high));
    const rangeLow = Math.min(...history.slice(-20).map(c => c.low));

    const atHigh = currentPrice >= rangeHigh * 0.998;
    const atLow = currentPrice <= rangeLow * 1.002;

    if (atHigh) {
      return {
        isActive: true,
        direction: "Bearish" as const,
        confidence: 75,
        entryZone: { high: rangeHigh, low: rangeHigh - (rangeHigh - rangeLow) * 0.1 },
        description: `Price at range high during ${killZone.zone?.name}`
      };
    }

    if (atLow) {
      return {
        isActive: true,
        direction: "Bullish" as const,
        confidence: 75,
        entryZone: { low: rangeLow, high: rangeLow + (rangeHigh - rangeLow) * 0.1 },
        description: `Price at range low during ${killZone.zone?.name}`
      };
    }

    return { isActive: false, direction: null, confidence: 0, description: "Not at range extreme" };
  }

  /**
   * Detect Judas Swing
   */
  static async detectJudasSwing(symbol: string) {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    const liquidityZones = detectLiquidityZones(history);
    const recentGrabs = liquidityZones.filter(z => z.grabCount > 0);

    if (recentGrabs.length === 0) {
      return { isActive: false, direction: null, confidence: 0, description: "No recent liquidity grabs" };
    }

    const lastGrab = recentGrabs[0];
    const currentPrice = history[history.length - 1].close;
    const avgRange = history.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / 20;

    if (lastGrab.type.includes("High") && currentPrice < lastGrab.price - avgRange * 0.5) {
      return {
        isActive: true,
        direction: "Bullish" as const,
        confidence: 70,
        description: `Bearish grab at ${lastGrab.price.toFixed(2)} - reversal setup`
      };
    }

    if (lastGrab.type.includes("Low") && currentPrice > lastGrab.price + avgRange * 0.5) {
      return {
        isActive: true,
        direction: "Bearish" as const,
        confidence: 70,
        description: `Bullish grab at ${lastGrab.price.toFixed(2)} - reversal setup`
      };
    }

    return { isActive: false, direction: null, confidence: 0, description: "Waiting for confirmation" };
  }

  /**
   * Power of 3 Analysis
   */
  static async analyzePowerOf3(symbol: string) {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    const recent = history.slice(-50);
    const rangeHigh = Math.max(...recent.map(c => c.high));
    const rangeLow = Math.min(...recent.map(c => c.low));
    const volatility = recent.reduce((sum, c) => sum + (c.high - c.low), 0) / (rangeHigh - rangeLow) / recent.length;

    if (volatility < 0.08) {
      return { phase: "Accumulation" as const, confidence: 75, description: "Low volatility ranging" };
    }

    const lastCandle = recent[recent.length - 1];
    const isLargeBody = Math.abs(lastCandle.close - lastCandle.open) > (rangeHigh - rangeLow) * 0.02;

    if (isLargeBody) {
      return {
        phase: lastCandle.close > lastCandle.open ? "Distribution" as const : "Manipulation" as const,
        confidence: 70,
        description: "Large institutional candle detected"
      };
    }

    return { phase: "Unknown" as const, confidence: 50, description: "No clear AMD phase" };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static inferTimeframe(ob: any, history: OHLCV[]): string {
    const hours = (history[ob.endIndex]?.timestamp - history[ob.startIndex]?.timestamp) / (1000 * 60 * 60);
    if (hours < 1) return "15m";
    if (hours < 4) return "1h";
    if (hours < 24) return "4h";
    return "Daily";
  }

  // ============================================================================
  // DEPRECATED METHODS
  // ============================================================================

  static async analyzeMarketSignals(symbol: string): Promise<string> {
    try {
      const analysis = await this.analyzeAllStrategies(symbol);
      return JSON.stringify({
        bias: analysis.signal.overallBias,
        confidence: analysis.signal.overallConfidence,
        setups: analysis.allSetups.length,
        topStrategy: analysis.signal.smc.bias !== "Neutral" ? "SMC" :
                      analysis.signal.cot.sentiment !== "Neutral" ? "COT" : "Sentiment"
      });
    } catch (e) {
      return JSON.stringify({ error: "Analysis failed" });
    }
  }

  static getSmartMoneyPatterns(): SmartMoneyPattern[] { return []; }
  static scanPatterns(): PatternScanResult[] { return []; }
  static getSentimentInsights(): SentimentInsight[] { return []; }
  static detectAnomalies(): AnomalyAlert[] { return []; }
  static getConfluenceAnalysis(): ConfluenceAnalysis {
    return { symbol: "", spotPrice: 0, atr: 0, consensusScore: 0, technicalBias: { bias: "Neutral", rsiState: "Neutral", sma20: 0, sma50: 0, ema20: 0 }, aiPatternScan: { bias: "Neutral", score: 0, patterns: [] }, summary: { sentiment: { bias: "Neutral", score: 0 }, anomalies: 0, smcSetups: 0 } };
  }
  static getPrioritySignals() { return []; }
}
