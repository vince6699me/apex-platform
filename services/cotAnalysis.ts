/**
 * Commitment of Traders (COT) Analysis Service
 * 
 * Implements COT-based trading strategies:
 * - Commercial trader positioning (Smart Money)
 * - Non-commercial trader positioning (Large Speculators)
 * - Sentiment extremes identification
 * - Contrarian and smart money following strategies
 * 
 * Data Sources:
 * - CFTC Commitment of Traders reports
 * - Commercial data providers (Quandl, Barchart)
 */

import { OHLCV, TradeSetup, IndicatorSignal } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface COTData {
  reportDate: string;
  symbol: string;
  commercialLong: number;
  commercialShort: number;
  commercialNet: number;
  nonCommercialLong: number;
  nonCommercialShort: number;
  nonCommercialNet: number;
  nonReportableLong: number;
  nonReportableShort: number;
  totalOpenInterest: number;
  commercialsPercentLong: number;
  commercialsPercentShort: number;
  largeSpecsPercentLong: number;
  largeSpecsPercentShort: number;
}

export interface COTPosition {
  type: "commercial" | "nonCommercial" | "nonReportable";
  netPosition: number;
  percentOfTotal: number;
  sentiment: "extremeLong" | "extremeShort" | "neutral";
  historicalContext: {
    percentile: number; // 0-100 compared to historical data
    yearHigh: number;
    yearLow: number;
    allTimeHigh: number;
    allTimeLow: number;
  };
}

export interface COTAnalysis {
  symbol: string;
  reportDate: string;
  commercialPosition: COTPosition;
  largeSpecPosition: COTPosition;
  sentimentAnalysis: {
    overall: "bullish" | "bearish" | "neutral";
    confidence: number; // 0-100
    commercialBias: "bullish" | "bearish" | "neutral";
    largeSpecBias: "bullish" | "bearish" | "neutral";
  };
  tradeSetups: COTTradeSetup[];
  divergence: {
    present: boolean;
    type: "priceCOT" | "sentimentPrice";
    description: string;
  };
}

export interface COTTradeSetup {
  id: string;
  strategy: "fadeLargeSpecs" | "followCommercials";
  direction: "long" | "short";
  confidence: number;
  entryTrigger: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: number;
  reasoning: string;
}

export interface COTSignal {
  indicator: string;
  signal: "Bullish" | "Bearish" | "Neutral";
  strength: number; // 0-100
  value: string;
  description: string;
  commercialNet?: number;
  largeSpecNet?: number;
}

// ============================================================================
// COT ANALYSIS SERVICE
// ============================================================================

export class COTAnalysisService {
  
  /**
   * Fetch COT data for a symbol (simulated - would use real API)
   */
  static async getCOTData(symbol: string): Promise<COTData> {
    // In production, this would fetch from:
    // - CFTC public data
    // - Quandl COT database
    // - Barchart.com COT data
    
    // Simulated data for demonstration
    return this.generateSimulatedCOTData(symbol);
  }
  
  /**
   * Generate simulated COT data (for demo purposes)
   */
  static generateSimulatedCOTData(symbol: string): COTData {
    const baseDate = new Date().toISOString().split('T')[0];
    const totalOI = Math.random() * 500000 + 100000;
    
    const commercialNet = (Math.random() - 0.5) * totalOI * 0.3;
    const commercialLong = (totalOI / 2) + commercialNet;
    const commercialShort = (totalOI / 2) - commercialNet;
    
    const largeSpecNet = -(Math.random() - 0.5) * totalOI * 0.2;
    const nonCommercialLong = (totalOI / 2) + largeSpecNet;
    const nonCommercialShort = (totalOI / 2) - largeSpecNet;
    
    const nonReportableLong = totalOI - commercialLong - nonCommercialLong;
    const nonReportableShort = totalOI - commercialShort - nonCommercialShort;
    
    return {
      reportDate: baseDate,
      symbol,
      commercialLong: Math.round(commercialLong),
      commercialShort: Math.round(commercialShort),
      commercialNet: Math.round(commercialNet),
      nonCommercialLong: Math.round(nonCommercialLong),
      nonCommercialShort: Math.round(nonCommercialShort),
      nonCommercialNet: Math.round(largeSpecNet),
      nonReportableLong: Math.round(nonReportableLong),
      nonReportableShort: Math.round(nonReportableShort),
      totalOpenInterest: Math.round(totalOI),
      commercialsPercentLong: parseFloat(((commercialLong / totalOI) * 100).toFixed(2)),
      commercialsPercentShort: parseFloat(((commercialShort / totalOI) * 100).toFixed(2)),
      largeSpecsPercentLong: parseFloat(((nonCommercialLong / totalOI) * 100).toFixed(2)),
      largeSpecsPercentShort: parseFloat(((nonCommercialShort / totalOI) * 100).toFixed(2))
    };
  }
  
  /**
   * Analyze COT data and generate trade setups
   */
  static analyzeCOT(cotData: COTData, priceAction?: string): COTAnalysis {
    const commercialPosition = this.analyzePosition(
      cotData.commercialNet,
      cotData.commercialLong,
      cotData.commercialShort,
      cotData.totalOpenInterest
    );
    
    const largeSpecPosition = this.analyzePosition(
      cotData.nonCommercialNet,
      cotData.nonCommercialLong,
      cotData.nonCommercialShort,
      cotData.totalOpenInterest
    );
    
    const sentimentAnalysis = this.analyzeSentiment(
      commercialPosition,
      largeSpecPosition
    );
    
    const tradeSetups = this.generateTradeSetups(
      commercialPosition,
      largeSpecPosition,
      sentimentAnalysis,
      cotData.symbol
    );
    
    return {
      symbol: cotData.symbol,
      reportDate: cotData.reportDate,
      commercialPosition,
      largeSpecPosition,
      sentimentAnalysis,
      tradeSetups,
      divergence: this.detectDivergence(commercialPosition, largeSpecPosition, priceAction)
    };
  }
  
  /**
   * Analyze a position and determine sentiment extremes
   */
  static analyzePosition(
    netPosition: number,
    longCount: number,
    shortCount: number,
    totalOI: number
  ): COTPosition {
    const percentOfTotal = parseFloat(((netPosition / totalOI) * 100).toFixed(2));
    
    // Determine sentiment based on historical context
    let sentiment: "extremeLong" | "extremeShort" | "neutral";
    if (percentOfTotal > 15) {
      sentiment = "extremeLong";
    } else if (percentOfTotal < -15) {
      sentiment = "extremeShort";
    } else {
      sentiment = "neutral";
    }
    
    // Calculate historical context (simulated)
    const yearHigh = Math.abs(totalOI * 0.25);
    const yearLow = -(totalOI * 0.25);
    const allTimeHigh = Math.abs(totalOI * 0.35);
    const allTimeLow = -(totalOI * 0.35);
    
    // Calculate percentile
    const range = allTimeHigh - allTimeLow;
    const percentile = range > 0 
      ? parseFloat((((netPosition - allTimeLow) / range) * 100).toFixed(2))
      : 50;
    
    return {
      type: netPosition > 0 ? "commercial" : "nonCommercial",
      netPosition,
      percentOfTotal,
      sentiment,
      historicalContext: {
        percentile: Math.min(100, Math.max(0, percentile)),
        yearHigh: Math.round(yearHigh),
        yearLow: Math.round(yearLow),
        allTimeHigh: Math.round(allTimeHigh),
        allTimeLow: Math.round(allTimeLow)
      }
    };
  }
  
  /**
   * Analyze overall sentiment from COT data
   */
  static analyzeSentiment(
    commercialPosition: COTPosition,
    largeSpecPosition: COTPosition
  ): COTAnalysis["sentimentAnalysis"] {
    let overall: "bullish" | "bearish" | "neutral" = "neutral";
    let confidence = 50;
    let commercialBias: "bullish" | "bearish" | "neutral" = "neutral";
    let largeSpecBias: "bullish" | "bearish" | "neutral" = "neutral";
    
    // Commercial bias (smart money)
    if (commercialPosition.netPosition > 0) {
      commercialBias = "bullish";
      confidence += 20;
    } else if (commercialPosition.netPosition < 0) {
      commercialBias = "bearish";
      confidence += 20;
    }
    
    // Large spec bias (usually wrong at extremes)
    if (largeSpecPosition.sentiment === "extremeLong") {
      largeSpecBias = "bearish"; // Fade them
      confidence += 15;
    } else if (largeSpecPosition.sentiment === "extremeShort") {
      largeSpecBias = "bullish"; // Fade them
      confidence += 15;
    }
    
    // Overall sentiment
    if (commercialBias === "bullish" && largeSpecBias === "bullish") {
      overall = "bullish";
      confidence = 75;
    } else if (commercialBias === "bearish" && largeSpecBias === "bearish") {
      overall = "bearish";
      confidence = 75;
    } else if (commercialBias !== largeSpecBias) {
      // Contrarian setup - follow commercial
      overall = commercialBias === "bullish" ? "bullish" : "bearish";
      confidence = 65;
    }
    
    return {
      overall,
      confidence,
      commercialBias,
      largeSpecBias
    };
  }
  
  /**
   * Generate trade setups based on COT analysis
   */
  static generateTradeSetups(
    commercialPosition: COTPosition,
    largeSpecPosition: COTPosition,
    sentiment: COTAnalysis["sentimentAnalysis"],
    symbol: string
  ): COTTradeSetup[] {
    const setups: COTTradeSetup[] = [];
    
    // Strategy 1: Fade Large Speculators (Contrarian)
    if (largeSpecPosition.sentiment === "extremeLong") {
      setups.push({
        id: `cot-fade-long-${Date.now()}`,
        strategy: "fadeLargeSpecs",
        direction: "short",
        confidence: Math.min(85, 60 + largeSpecPosition.historicalContext.percentile / 2),
        entryTrigger: "Large specs at extreme long - look for bearish price action",
        stopLoss: "Above recent swing high",
        takeProfit: "At key support or 2R",
        riskReward: 2,
        reasoning: "Large speculators tend to be wrong at extremes. Commercials are likely hedging against their positions."
      });
    }
    
    if (largeSpecPosition.sentiment === "extremeShort") {
      setups.push({
        id: `cot-fade-short-${Date.now()}`,
        strategy: "fadeLargeSpecs",
        direction: "long",
        confidence: Math.min(85, 60 + Math.abs(largeSpecPosition.historicalContext.percentile - 100) / 2),
        entryTrigger: "Large specs at extreme short - look for bullish price action",
        stopLoss: "Below recent swing low",
        takeProfit: "At key resistance or 2R",
        riskReward: 2,
        reasoning: "Large speculators tend to be wrong at extremes. Commercials are likely hedging against their positions."
      });
    }
    
    // Strategy 2: Follow Commercials (Smart Money)
    if (commercialPosition.netPosition > 0 && commercialPosition.historicalContext.percentile > 70) {
      setups.push({
        id: `cot-follow-commercials-long-${Date.now()}`,
        strategy: "followCommercials",
        direction: "long",
        confidence: Math.min(90, 50 + commercialPosition.historicalContext.percentile / 1.5),
        entryTrigger: "Commercials heavily long - wait for dip/retest",
        stopLoss: "Below swing low / commercial entry zone",
        takeProfit: "At premium zone or 3R",
        riskReward: 3,
        reasoning: "Commercials have real business needs and superior knowledge of supply/demand fundamentals."
      });
    }
    
    if (commercialPosition.netPosition < 0 && commercialPosition.historicalContext.percentile < 30) {
      setups.push({
        id: `cot-follow-commercials-short-${Date.now()}`,
        strategy: "followCommercials",
        direction: "short",
        confidence: Math.min(90, 50 + (100 - commercialPosition.historicalContext.percentile) / 1.5),
        entryTrigger: "Commercials heavily short - wait for rally/retest",
        stopLoss: "Above swing high / commercial entry zone",
        takeProfit: "At discount zone or 3R",
        riskReward: 3,
        reasoning: "Commercials have real business needs and superior knowledge of supply/demand fundamentals."
      });
    }
    
    return setups;
  }
  
  /**
   * Detect divergence between price action and COT data
   */
  static detectDivergence(
    commercialPosition: COTPosition,
    largeSpecPosition: COTPosition,
    priceAction?: string
  ): COTAnalysis["divergence"] {
    // Price-COT divergence
    if (commercialPosition.sentiment === "extremeLong" && priceAction?.includes("down")) {
      return {
        present: true,
        type: "priceCOT",
        description: "Price making lower lows while commercials are extremely long - potential reversal signal"
      };
    }
    
    if (commercialPosition.sentiment === "extremeShort" && priceAction?.includes("up")) {
      return {
        present: true,
        type: "priceCOT",
        description: "Price making higher highs while commercials are extremely short - potential reversal signal"
      };
    }
    
    // Sentiment-Price divergence
    if (largeSpecPosition.sentiment === "extremeLong" && commercialPosition.netPosition < 0) {
      return {
        present: true,
        type: "sentimentPrice",
        description: "Large specs extremely bullish while commercials are bearish - contrarian opportunity"
      };
    }
    
    return {
      present: false,
      type: "priceCOT",
      description: "No significant divergence detected"
    };
  }
  
  /**
   * Generate COT indicator signal
   */
  static getCOTSignal(cotData: COTData): COTSignal {
    const analysis = this.analyzeCOT(cotData);
    
    let signal: "Bullish" | "Bearish" | "Neutral" = "Neutral";
    let strength = 50;
    let description = "";
    
    if (analysis.tradeSetups.length > 0) {
      const primarySetup = analysis.tradeSetups[0];
      signal = primarySetup.direction === "long" ? "Bullish" : "Bearish";
      strength = primarySetup.confidence;
      description = `${primarySetup.strategy}: ${primarySetup.reasoning}`;
    } else {
      description = "COT data shows neutral positioning - no clear directional bias";
    }
    
    return {
      indicator: "COT Analysis",
      signal,
      strength,
      value: `Commercial: ${cotData.commercialNet.toLocaleString()} | Large Specs: ${cotData.nonCommercialNet.toLocaleString()}`,
      description,
      commercialNet: cotData.commercialNet,
      largeSpecNet: cotData.nonCommercialNet
    };
  }
  
  /**
   * Run comprehensive COT analysis on a symbol
   */
  static async runCOTAnalysis(symbol: string, priceAction?: string): Promise<{
    analysis: COTAnalysis;
    cotData: COTData;
    signal: COTSignal;
    setups: TradeSetup[];
  }> {
    const cotData = await this.getCOTData(symbol);
    const analysis = this.analyzeCOT(cotData, priceAction);
    const signal = this.getCOTSignal(cotData);
    
    // Convert to TradeSetup format for integration
    const setups: TradeSetup[] = analysis.tradeSetups.map(setup => ({
      id: setup.id,
      symbol,
      direction: setup.direction === "long" ? "Bullish" : "Bearish",
      entryPrice: 0, // Would be calculated based on current price
      stopLoss: parseFloat(setup.stopLoss),
      takeProfits: [parseFloat(setup.takeProfit)],
      riskReward: setup.riskReward,
      confidence: setup.confidence,
      reasoning: setup.reasoning,
      killZone: "COT Signal",
      timestamp: Date.now()
    }));
    
    return {
      analysis,
      cotData,
      signal,
      setups
    };
  }
}

// ============================================================================
// COT INDICATOR INTEGRATION
// ============================================================================

/**
 * Calculate COT-based indicator values for charts
 */
export function calculateCOTIndicators(cotData: COTData): {
  commercialNet: number;
  largeSpecNet: number;
  commercialRatio: number;
  largeSpecRatio: number;
  sentimentScore: number; // -100 to 100
} {
  const totalOI = cotData.totalOpenInterest || 1;
  
  return {
    commercialNet: cotData.commercialNet,
    largeSpecNet: cotData.nonCommercialNet,
    commercialRatio: parseFloat(((cotData.commercialLong / (cotData.commercialLong + cotData.commercialShort)) * 100).toFixed(2)),
    largeSpecRatio: parseFloat(((cotData.nonCommercialLong / (cotData.nonCommercialLong + cotData.nonCommercialShort)) * 100).toFixed(2)),
    sentimentScore: parseFloat(((cotData.commercialNet / totalOI) * 100).toFixed(2))
  };
}

/**
 * Get historical COT extremes for comparison
 */
export function getCOTExtremes(cotData: COTData): {
  commercialExtremes: { high: number; low: number; current: number };
  largeSpecExtremes: { high: number; low: number; current: number };
} {
  const analysis = COTAnalysisService.analyzeCOT(cotData);
  
  return {
    commercialExtremes: {
      high: analysis.commercialPosition.historicalContext.yearHigh,
      low: analysis.commercialPosition.historicalContext.yearLow,
      current: analysis.commercialPosition.netPosition
    },
    largeSpecExtremes: {
      high: analysis.largeSpecPosition.historicalContext.yearHigh,
      low: analysis.largeSpecPosition.historicalContext.yearLow,
      current: analysis.largeSpecPosition.netPosition
    }
  };
}
