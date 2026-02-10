/**
 * AI Intelligence Service - Production SMC Edition
 * 
 * Real-time SMC analysis using actual market data:
 * - Smart Money Patterns (Order Blocks, FVGs, Liquidity)
 * - Market Structure (BOS, CHOCH, MSS)
 * - Premium/Discount Analysis
 * - Optimal Trade Entry (OTE)
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
  Quote
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
    // Fetch real market data
    const [history, quote] = await Promise.all([
      MarketDataService.getHistoryFromPolygon(symbol),
      MarketDataService.getQuoteFromAlphaVantage(symbol)
    ]);

    const currentPrice = quote.price;

    // Run SMC analysis on real data
    const smcAnalysis = runSMCAnalysis(history, currentPrice);

    // Generate trade setups from real analysis
    const tradeSetups = this.generateTradeSetups(symbol, smcAnalysis, currentPrice);

    // Get real kill zone
    const killZone = getActiveKillZone().zone;

    return {
      smcAnalysis,
      tradeSetups,
      killZone,
      quote
    };
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
        killZone: killZone.zone?.name || "None",
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
        killZone: killZone.zone?.name || "None",
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
          killZone: killZone.zone?.name || "None",
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
          killZone: killZone.zone?.name || "None",
          confidence: fvg.strength === "Strong" ? 80 : 65,
          premiumDiscount: analysis.premiumDiscount.position,
          timestamp: Date.now()
        });
      }
    });

    // Sort by confidence
    return setups.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  // ============================================================================
  // ENHANCED SMC PATTERNS - REAL DATA
  // ============================================================================

  /**
   * Get real SMC patterns for a symbol
   */
  static async getEnhancedSMCPatterns(symbol: string): Promise<SmartMoneyPattern[]> {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    const analysis = runSMCAnalysis(history, history[history.length - 1].close);
    const patterns: SmartMoneyPattern[] = [];

    // Order Blocks
    analysis.orderBlocks.forEach((ob, i) => {
      patterns.push({
        id: `${symbol}-ob-${i}-${Date.now()}`,
        symbol,
        concept: `${ob.type} Order Block`,
        bias: ob.type === "Bullish" ? "Bullish" : "Bearish",
        timeframe: this.inferTimeframe(ob, history),
        confidence: ob.quality === "High" ? 85 : ob.quality === "Medium" ? 70 : 55,
        zone: `${ob.discountPremium} Zone`,
        description: `${ob.type} OB at ${ob.high.toFixed(2)}-${ob.low.toFixed(2)}, quality: ${ob.quality.toLowerCase()}`,
        retested: new Date(ob.timestamp).toLocaleString()
      });
    });

    // FVGs
    analysis.fairValueGaps.filter(fvg => !fvg.mitigated).slice(0, 5).forEach((fvg, i) => {
      patterns.push({
        id: `${symbol}-fvg-${i}-${Date.now()}`,
        symbol,
        concept: "Fair Value Gap",
        bias: fvg.type === "Bullish" ? "Bullish" : "Bearish",
        timeframe: "1h",
        confidence: fvg.strength === "Strong" ? 80 : fvg.strength === "Medium" ? 65 : 50,
        zone: fvg.type === "Bullish" ? "Below Price" : "Above Price",
        description: `${fvg.type} FVG: ${fvg.size.toFixed(2)} pips, ${fvg.strength.toLowerCase()} imbalance`,
        retested: new Date(fvg.timestamp).toLocaleString()
      });
    });

    // Liquidity Zones
    analysis.liquidityZones.filter(z => z.strength > 50 && !z.grabbed).slice(0, 3).forEach((z, i) => {
      patterns.push({
        id: `${symbol}-liq-${i}-${Date.now()}`,
        symbol,
        concept: `${z.type} Liquidity`,
        bias: z.type.includes("High") ? "Bearish" : "Bullish",
        timeframe: "4h",
        confidence: z.strength,
        zone: z.price.toFixed(2),
        description: `${z.type} at ${z.price.toFixed(2)}, touched ${z.grabCount} times`,
        retested: new Date(z.lastTested).toLocaleString()
      });
    });

    // BOS
    analysis.bos.slice(-5).forEach((b, i) => {
      const candle = history[b.index];
      patterns.push({
        id: `${symbol}-bos-${i}-${Date.now()}`,
        symbol,
        concept: "Break of Structure",
        bias: b.type === "Bullish" ? "Bullish" : "Bearish",
        timeframe: "1h",
        confidence: b.confidence,
        zone: b.price.toFixed(2),
        description: `${b.type} BOS confirming ${b.trendContinuation ? "continuation" : "reversal"}`,
        retested: candle ? new Date(candle.timestamp).toLocaleString() : "Unknown"
      });
    });

    return patterns;
  }

  /**
   * Infer timeframe from candle indices
   */
  private static inferTimeframe(ob: any, history: OHLCV[]): string {
    const candleCount = ob.endIndex - ob.startIndex;
    if (history.length < ob.endIndex) return "Unknown";

    const timeDiff = history[ob.endIndex]?.timestamp - history[ob.startIndex]?.timestamp;
    const hours = timeDiff / (1000 * 60 * 60);

    if (hours < 1) return "15m";
    if (hours < 4) return "1h";
    if (hours < 24) return "4h";
    return "Daily";
  }

  // ============================================================================
  // SPECIAL PATTERNS - REAL DATA
  // ============================================================================

  /**
   * Detect Silver Bullet setup (time/price window)
   */
  static async detectSilverBullet(symbol: string): Promise<{
    isActive: boolean;
    direction: "Bullish" | "Bearish" | null;
    confidence: number;
    entryZone?: { high: number; low: number };
    description: string;
  }> {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    if (history.length < 20) {
      return { isActive: false, direction: null, confidence: 0, description: "Insufficient data" };
    }

    const killZone = getActiveKillZone();
    if (!killZone.isActive) {
      return { isActive: false, direction: null, confidence: 0, description: "Not in active kill zone" };
    }

    const currentPrice = history[history.length - 1].close;
    const rangeHigh = Math.max(...history.slice(-20).map(c => c.high));
    const rangeLow = Math.min(...history.slice(-20).map(c => c.low));

    // Check if at range extreme
    const atHigh = currentPrice >= rangeHigh * 0.998;
    const atLow = currentPrice <= rangeLow * 1.002;

    if (atHigh) {
      return {
        isActive: true,
        direction: "Bearish",
        confidence: 75,
        entryZone: { high: rangeHigh, low: rangeHigh - (rangeHigh - rangeLow) * 0.1 },
        description: `Price at range high (${rangeHigh.toFixed(2)}) during ${killZone.zone?.name} - reversal setup`
      };
    }

    if (atLow) {
      return {
        isActive: true,
        direction: "Bullish",
        confidence: 75,
        entryZone: { low: rangeLow, high: rangeLow + (rangeHigh - rangeLow) * 0.1 },
        description: `Price at range low (${rangeLow.toFixed(2)}) during ${killZone.zone?.name} - reversal setup`
      };
    }

    return { isActive: false, direction: null, confidence: 0, description: "Price not at range extreme" };
  }

  /**
   * Detect Judas Swing (liquidity grab + reversal)
   */
  static async detectJudasSwing(symbol: string): Promise<{
    isActive: boolean;
    direction: "Bullish" | "Bearish" | null;
    confidence: number;
    description: string;
  }> {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    if (history.length < 30) {
      return { isActive: false, direction: null, confidence: 0, description: "Insufficient data" };
    }

    const liquidityZones = detectLiquidityZones(history);
    const recentGrabs = liquidityZones.filter(z =>
      z.grabCount > 0 &&
      (Date.now() - z.lastTouchTime) < 5 * 24 * 60 * 60 * 1000 // Within 5 days
    );

    if (recentGrabs.length === 0) {
      return { isActive: false, direction: null, confidence: 0, description: "No recent liquidity grabs" };
    }

    const lastGrab = recentGrabs[0];
    const currentPrice = history[history.length - 1].close;
    const avgRange = history.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / 20;

    if (lastGrab.type.includes("High") && currentPrice < lastGrab.price - avgRange * 0.5) {
      return {
        isActive: true,
        direction: "Bullish",
        confidence: 70,
        description: `Bearish grab at ${lastGrab.price.toFixed(2)} - reversal long opportunity`
      };
    }

    if (lastGrab.type.includes("Low") && currentPrice > lastGrab.price + avgRange * 0.5) {
      return {
        isActive: true,
        direction: "Bearish",
        confidence: 70,
        description: `Bullish grab at ${lastGrab.price.toFixed(2)} - reversal short opportunity`
      };
    }

    return { isActive: false, direction: null, confidence: 0, description: "Waiting for reversal confirmation" };
  }

  /**
   * Power of 3 Analysis (Accumulation, Manipulation, Distribution)
   */
  static async analyzePowerOf3(symbol: string): Promise<{
    phase: "Accumulation" | "Manipulation" | "Distribution" | "Unknown";
    confidence: number;
    description: string;
    levels?: { accumulation: number; manipulation: number; distribution: number };
  }> {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    if (history.length < 50) {
      return { phase: "Unknown", confidence: 0, description: "Insufficient data for AMD analysis" };
    }

    const recent = history.slice(-50);
    const rangeHigh = Math.max(...recent.map(c => c.high));
    const rangeLow = Math.min(...recent.map(c => c.low));
    const rangeMid = (rangeHigh + rangeLow) / 2;

    const ranges = recent.map(c => c.high - c.low);
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    const volatility = avgRange / (rangeHigh - rangeLow);

    const currentCandle = recent[recent.length - 1];
    const bodySize = Math.abs(currentCandle.close - currentCandle.open);
    const isLargeBody = bodySize > avgRange * 1.5;

    if (volatility < 0.08) {
      return {
        phase: "Accumulation",
        confidence: 75,
        description: "Low volatility, ranging between accumulation levels",
        levels: { accumulation: rangeLow, manipulation: rangeMid, distribution: rangeHigh }
      };
    }

    if (isLargeBody) {
      const direction = currentCandle.close > currentCandle.open ? "Distribution" : "Manipulation";
      return {
        phase: direction,
        confidence: 70,
        description: `Large ${direction.toLowerCase()} candle detected - institutional activity`,
        levels: { accumulation: rangeLow, manipulation: rangeMid, distribution: rangeHigh }
      };
    }

    return {
      phase: "Unknown",
      confidence: 50,
      description: "No clear AMD phase - consolidation or ranging",
      levels: { accumulation: rangeLow, manipulation: rangeMid, distribution: rangeHigh }
    };
  }

  // ============================================================================
  // MARKET SCANNING - REAL DATA
  // ============================================================================

  /**
   * Scan multiple symbols for opportunities
   */
  static async scanMarkets(symbols: string[] = ["AAPL", "TSLA", "MSFT", "NVDA", "GOOGL"]): Promise<{
    scanResults: {
      symbol: string;
      price: number;
      change: number;
      bias: string;
      setups: number;
      killZone: string;
      topPattern: string;
      error?: boolean;
    }[];
    timestamp: number;
  }> {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const [analysis, quote] = await Promise.all([
            this.analyzeWithSMC(symbol),
            MarketDataService.getQuoteFromAlphaVantage(symbol)
          ]);

          return {
            symbol,
            price: quote.price,
            change: quote.changePercent,
            bias: analysis.smcAnalysis.currentBias,
            setups: analysis.tradeSetups.length,
            killZone: analysis.killZone?.name || "Off",
            topPattern: analysis.smcAnalysis.orderBlocks[0]?.type
              ? `${analysis.smcAnalysis.orderBlocks[0].type} OB`
              : analysis.smcAnalysis.fairValueGaps[0]?.type
                ? `${analysis.smcAnalysis.fairValueGaps[0].type} FVG`
                : "Structure"
          };
        } catch (e) {
          return { symbol, error: true, price: 0, change: 0, bias: "Unknown", setups: 0, killZone: "Off", topPattern: "None" };
        }
      })
    );

    return {
      scanResults: results,
      timestamp: Date.now()
    };
  }

  // ============================================================================
  // MARKET STRUCTURE ANALYSIS
  // ============================================================================

  /**
   * Get market structure analysis
   */
  static async getMarketStructure(symbol: string): Promise<{
    trend: "Bullish" | "Bearish" | "Neutral";
    bos: any[];
    choch?: any;
    mss?: any;
    strength: number;
  }> {
    const history = await MarketDataService.getHistoryFromPolygon(symbol);
    const bos = detectBOS(history);
    const choch = detectCHOCH(history);
    const mss = detectMSS(history);

    let trend: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let strength = 50;

    if (bos.length > 0) {
      const recentBOS = bos.slice(-5);
      const bullishCount = recentBOS.filter(b => b.type === "Bullish").length;
      const bearishCount = recentBOS.filter(b => b.type === "Bearish").length;

      if (bullishCount > bearishCount) {
        trend = "Bullish";
        strength = Math.min(50 + bullishCount * 10, 90);
      } else if (bearishCount > bullishCount) {
        trend = "Bearish";
        strength = Math.min(50 + bearishCount * 10, 90);
      }
    }

    if (choch) {
      trend = choch.type;
      strength = choch.confidence;
    }

    return { trend, bos, choch, mss, strength };
  }

  // ============================================================================
  // DEPRECATED METHODS (Legacy - Use Real Data Alternatives)
  // ============================================================================

  /**
   * @deprecated Use analyzeWithSMC() instead
   */
  static async analyzeMarketSignals(symbol: string): Promise<string> {
    try {
      const analysis = await this.analyzeWithSMC(symbol);
      return JSON.stringify({
        bias: analysis.smcAnalysis.currentBias,
        strength: analysis.smcAnalysis.trendStrength,
        setups: analysis.tradeSetups.length,
        killZone: analysis.killZone?.name || "Off"
      });
    } catch (e) {
      return JSON.stringify({ error: "Analysis failed" });
    }
  }

  /**
   * @deprecated Use getEnhancedSMCPatterns() instead
   */
  static getSmartMoneyPatterns(): SmartMoneyPattern[] {
    // Return empty - use real SMC analysis
    return [];
  }

  /**
   * @deprecated Use scanMarkets() instead
   */
  static scanPatterns(): PatternScanResult[] {
    // Return empty - use real market scan
    return [];
  }

  /**
   * @deprecated Use real API data from MarketDataService
   */
  static getSentimentInsights(symbols?: string[]): SentimentInsight[] {
    // Return empty - use real market data
    return [];
  }

  /**
   * @deprecated Use real analysis
   */
  static detectAnomalies(symbols: string[] = ["AAPL"]): AnomalyAlert[] {
    return [];
  }

  /**
   * @deprecated Use analyzeWithSMC() instead
   */
  static getConfluenceAnalysis(symbol: string): ConfluenceAnalysis {
    return {
      symbol: symbol.toUpperCase(),
      spotPrice: 0,
      atr: 0,
      consensusScore: 0,
      technicalBias: { bias: "Neutral", rsiState: "Neutral", sma20: 0, sma50: 0, ema20: 0 },
      aiPatternScan: { bias: "Neutral", score: 0, patterns: [] },
      summary: { sentiment: { bias: "Neutral", score: 0 }, anomalies: 0, smcSetups: 0 }
    };
  }

  /**
   * @deprecated Use analyzeWithSMC() and scanMarkets() instead
   */
  static getPrioritySignals() {
    return [];
  }
}
