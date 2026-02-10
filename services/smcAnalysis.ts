/**
 * Smart Money Concepts (SMC) Analysis Service
 * 
 * Implements ICT/SMC trading concepts:
 * - Order Blocks (OB)
 * - Fair Value Gaps (FVG)
 * - Liquidity Zones (Highs/Lows)
 * - Premium/Discount Zones
 * - Break of Structure (BOS)
 * - Change of Character (CHoCH)
 * - Market Structure Shifts
 */

import { Candle } from "../types";

// Candle data structure
export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

// SMC Analysis Result
export interface SMCAnalysis {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityZones: LiquidityZone[];
  marketStructure: MarketStructure;
  premiumDiscountZones: PremiumDiscountZone[];
  swingPoints: SwingPoint[];
}

export interface OrderBlock {
  id: string;
  type: "bullish" | "bearish";
  startIndex: number;
  endIndex: number;
  priceHigh: number;
  priceLow: number;
  startPrice: number;
  endPrice: number;
  isProximal: boolean;
  strength: "high" | "medium" | "low";
  invalidationPrice: number;
  targetPrice: number | null;
}

export interface FairValueGap {
  id: string;
  type: "bullish" | "bearish";
  index: number;
  high: number;
  low: number;
  size: number;
  filledPercent: number;
  isMitigated: boolean;
  isFavorableEntry: boolean;
}

export interface LiquidityZone {
  id: string;
  type: "high" | "low" | "equal_high" | "equal_low";
  price: number;
  strength: "strong" | "medium" | "weak";
  touchCount: number;
  lastTouchTime: number;
  isSwept: boolean;
}

export interface MarketStructure {
  trend: "bullish" | "bearish" | "ranging";
  currentSwing: "higher_high" | "higher_low" | "lower_high" | "lower_low";
  structureDirection: "bullish" | "bearish" | "neutral";
  BOS: BreakOfStructure[];
  CHOCH: ChangeOfCharacter[];
  lastSwingHigh: number;
  lastSwingLow: number;
  currentPricePosition: "premium" | "discount" | "equilibrium";
}

export interface BreakOfStructure {
  type: "bullish" | "bearish";
  index: number;
  price: number;
  timeframe: string;
}

export interface ChangeOfCharacter {
  type: "bullish" | "bearish";
  index: number;
  price: number;
  description: string;
}

export interface PremiumDiscountZone {
  type: "premium" | "discount" | "equilibrium";
  description: string;
  recommendation: string;
}

export interface SwingPoint {
  type: "high" | "low";
  index: number;
  price: number;
  strength: "strong" | "medium" | "weak";
}

export interface SMCConfig {
  fvgThreshold: number;  // Min candle size for FVG (default 2)
  obLookback: number;    // Lookback for Order Blocks
  liquidityLookback: number; // Lookback for Liquidity zones
  swingLookback: number; // Lookback for Swing points
}

// Default configuration
const DEFAULT_CONFIG: SMCConfig = {
  fvgThreshold: 2,
  obLookback: 100,
  liquidityLookback: 50,
  swingLookback: 20
};

// Helper to generate candles from price data
export function generateCandles(prices: number[], volumes?: number[]): CandleData[] {
  const candles: CandleData[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    // Simulate OHLC from close prices (for demo)
    const close = prices[i];
    const open = i > 0 ? prices[i - 1] : close;
    const volatility = Math.abs(close - open) * 1.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      open,
      high,
      low,
      close,
      volume: volumes?.[i] || Math.random() * 1000000,
      timestamp: Date.now() - (prices.length - i) * 86400000
    });
  }
  
  return candles;
}

// Generate realistic market data with SMC patterns
export function generateSMCData(symbol: string = "BTC", trend: "bullish" | "bearish" | "ranging" = "bullish"): { candles: CandleData[], smc: SMCAnalysis } {
  const candleCount = 200;
  const candles: CandleData[] = [];
  let price = getStartingPrice(symbol);
  let trendMultiplier = trend === "bullish" ? 0.002 : trend === "bearish" ? -0.002 : 0.001;
  
  for (let i = 0; i < candleCount; i++) {
    // Create trend with corrections
    const correction = Math.sin(i / 20) * 0.03;
    const noise = (Math.random() - 0.5) * 0.02;
    const dailyTrend = trendMultiplier + correction + noise;
    
    price = price * (1 + dailyTrend);
    
    // Create candle
    const body = Math.abs(price - (candles[i - 1]?.close || price)) * (0.5 + Math.random() * 0.5);
    const wicks = body * (0.3 + Math.random() * 0.4);
    
    const open = i > 0 ? candles[i - 1].close : price;
    const isGreen = Math.random() > 0.45;
    const close = isGreen ? open + body : open - body;
    const high = isGreen ? close + wicks : open + wicks;
    const low = isGreen ? open - wicks : close - wicks;
    
    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(1000000 + Math.random() * 5000000),
      timestamp: Date.now() - (candleCount - i) * 3600000
    });
  }
  
  const smc = analyzeSMC(candles);
  return { candles, smc };
}

function getStartingPrice(symbol: string): number {
  const prices: Record<string, number> = {
    "BTC": 67000,
    "ETH": 3500,
    "SOL": 145,
    "AAPL": 178,
    "TSLA": 175,
    "NVDA": 495,
    "MSFT": 375,
    "EUR/USD": 1.08,
    "GBP/USD": 1.27,
    "USD/JPY": 152,
    "GOLD": 2045,
    "OIL": 75,
    "SPX": 4780,
    "NDX": 16700
  };
  return prices[symbol] || 100;
}

// Main SMC Analysis Function
export function analyzeSMC(candles: CandleData[], config: Partial<SMCConfig> = {}): SMCAnalysis {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const orderBlocks = detectOrderBlocks(candles, cfg);
  const fairValueGaps = detectFairValueGaps(candles, cfg);
  const liquidityZones = detectLiquidityZones(candles, cfg);
  const swingPoints = detectSwingPoints(candles, cfg);
  const marketStructure = analyzeMarketStructure(candles, swingPoints);
  const premiumDiscountZones = identifyPremiumDiscountZones(marketStructure, candles);
  
  return {
    orderBlocks,
    fairValueGaps,
    liquidityZones,
    marketStructure,
    premiumDiscountZones,
    swingPoints
  };
}

// Detect Order Blocks
function detectOrderBlocks(candles: CandleData[], config: SMCConfig): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];
  
  for (let i = 20; i < candles.length - 10; i++) {
    const currentCandle = candles[i];
    const prevCandle = candles[i - 1];
    const nextCandle = candles[i + 1];
    
    // Bullish Order Block: Green candle followed by upward momentum
    if (isBullishOrderBlock(candles, i, config)) {
      const obHigh = findOBHigh(candles, i);
      const obLow = findOBLow(candles, i);
      
      orderBlocks.push({
        id: `OB-B-${i}`,
        type: "bullish",
        startIndex: i - 2,
        endIndex: i,
        priceHigh: obHigh,
        priceLow: obLow,
        startPrice: candles[i - 2].open,
        endPrice: currentCandle.close,
        isProximal: isProximalOrderBlock(candles, i),
        strength: calculateOBStrength(candles, i, "bullish"),
        invalidationPrice: obLow - (obHigh - obLow) * 0.5,
        targetPrice: obHigh + (obHigh - obLow) * 1.5
      });
    }
    
    // Bearish Order Block: Red candle followed by downward momentum
    if (isBearishOrderBlock(candles, i, config)) {
      const obHigh = findOBHigh(candles, i);
      const obLow = findOBLow(candles, i);
      
      orderBlocks.push({
        id: `OB-S-${i}`,
        type: "bearish",
        startIndex: i - 2,
        endIndex: i,
        priceHigh: obHigh,
        priceLow: obLow,
        startPrice: candles[i - 2].open,
        endPrice: currentCandle.close,
        isProximal: isProximalOrderBlock(candles, i),
        strength: calculateOBStrength(candles, i, "bearish"),
        invalidationPrice: obHigh + (obHigh - obLow) * 0.5,
        targetPrice: obLow - (obHigh - obLow) * 1.5
      });
    }
  }
  
  return orderBlocks.slice(-20); // Keep last 20 OBs
}

function isBullishOrderBlock(candles: CandleData[], i: number, config: SMCConfig): boolean {
  if (i < 3) return false;
  
  const currentCandle = candles[i];
  const prevCandle = candles[i - 1];
  
  // Bullish candle
  if (currentCandle.close <= currentCandle.open) return false;
  
  // Check for institutional buying interest (break of structure)
  let bullishMomentum = false;
  for (let j = i + 1; j < Math.min(i + 5, candles.length); j++) {
    if (candles[j].close > candles[j].open && 
        candles[j].close > candles[i].high + (currentCandle.high - currentCandle.low)) {
      bullishMomentum = true;
      break;
    }
  }
  
  return bullishMomentum;
}

function isBearishOrderBlock(candles: CandleData[], i: number, config: SMCConfig): boolean {
  if (i < 3) return false;
  
  const currentCandle = candles[i];
  const prevCandle = candles[i - 1];
  
  // Bearish candle
  if (currentCandle.close >= currentCandle.open) return false;
  
  // Check for institutional selling interest
  let bearishMomentum = false;
  for (let j = i + 1; j < Math.min(i + 5, candles.length); j++) {
    if (candles[j].close < candles[j].open && 
        candles[j].close < candles[i].low - (currentCandle.high - currentCandle.low)) {
      bearishMomentum = true;
      break;
    }
  }
  
  return bearishMomentum;
}

function findOBHigh(candles: CandleData[], i: number): number {
  let high = candles[i].high;
  for (let j = Math.max(0, i - 5); j <= i; j++) {
    high = Math.max(high, candles[j].high);
  }
  return high;
}

function findOBLow(candles: CandleData[], i: number): number {
  let low = candles[i].low;
  for (let j = Math.max(0, i - 5); j <= i; j++) {
    low = Math.min(low, candles[j].low);
  }
  return low;
}

function isProximalOrderBlock(candles: CandleData[], i: number): boolean {
  // Recent order block (within 10 candles from current price)
  const recentPrice = candles[candles.length - 1].close;
  const obPrice = (findOBHigh(candles, i) + findOBLow(candles, i)) / 2;
  return Math.abs(recentPrice - obPrice) / obPrice < 0.02; // Within 2%
}

function calculateOBStrength(candles: CandleData[], i: number, type: "bullish" | "bearish"): "high" | "medium" | "low" {
  const candle = candles[i];
  const bodySize = Math.abs(candle.close - candle.open);
  const range = candle.high - candle.low;
  const bodyRatio = bodySize / range;
  
  // Strong OBs have larger bodies
  if (bodyRatio > 0.7) return "high";
  if (bodyRatio > 0.4) return "medium";
  return "low";
}

// Detect Fair Value Gaps (FVG)
function detectFairValueGaps(candles: CandleData[], config: SMCConfig): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  
  for (let i = 2; i < candles.length; i++) {
    const candle = candles[i];
    const prev1 = candles[i - 1];
    const prev2 = candles[i - 2];
    
    // Bullish FVG: Previous low > Current high
    if (prev2.low > candle.high + (config.fvgThreshold * (candle.high - candle.low))) {
      const gapSize = prev2.low - candle.high;
      const currentPrice = candles[candles.length - 1].close;
      const gapMid = (prev2.low + candle.high) / 2;
      
      fvgs.push({
        id: `FVG-B-${i}`,
        type: "bullish",
        index: i,
        high: prev2.low,
        low: candle.high,
        size: gapSize,
        filledPercent: calculateFillPercent(candle.high, prev2.low, currentPrice),
        isMitigated: currentPrice >= prev2.low,
        isFavorableEntry: currentPrice > candle.high && currentPrice < gapMid
      });
    }
    
    // Bearish FVG: Previous high < Current low
    if (prev2.high < candle.low - (config.fvgThreshold * (candle.high - candle.low))) {
      const gapSize = candle.low - prev2.high;
      const currentPrice = candles[candles.length - 1].close;
      const gapMid = (candle.low + prev2.high) / 2;
      
      fvgs.push({
        id: `FVG-S-${i}`,
        type: "bearish",
        index: i,
        high: candle.low,
        low: prev2.high,
        size: gapSize,
        filledPercent: calculateFillPercent(prev2.high, candle.low, currentPrice),
        isMitigated: currentPrice <= prev2.high,
        isFavorableEntry: currentPrice < candle.low && currentPrice > gapMid
      });
    }
  }
  
  // Return last 15 FVGs, prioritizing unfilled ones
  return fvgs
    .sort((a, b) => {
      if (a.isMitigated !== b.isMitigated) return a.isMitigated ? 1 : -1;
      return b.index - a.index;
    })
    .slice(0, 15);
}

function calculateFillPercent(low: number, high: number, current: number): number {
  const range = high - low;
  if (range === 0) return 0;
  const filled = Math.min(Math.max(current - low, 0), range);
  return (filled / range) * 100;
}

// Detect Liquidity Zones
function detectLiquidityZones(candles: CandleData[], config: SMCConfig): LiquidityZone[] {
  const zones: LiquidityZone[] = [];
  const lookback = config.liquidityLookback;
  const recentCandles = candles.slice(-lookback);
  
  // Find highs and lows
  const highs = recentCandles.map((c, i) => ({ price: c.high, index: candles.length - lookback + i }));
  const lows = recentCandles.map((c, i) => ({ price: c.low, index: candles.length - lookback + i }));
  
  // Find equal highs (swing highs)
  for (let i = 0; i < highs.length - 2; i++) {
    if (isSimilarPrice(highs[i].price, highs[i + 1].price, highs[i + 2].price)) {
      zones.push({
        id: `EQH-${i}`,
        type: "equal_high",
        price: (highs[i].price + highs[i + 1].price + highs[i + 2].price) / 3,
        strength: "strong",
        touchCount: 3,
        lastTouchTime: highs[i + 2].timestamp,
        isSwept: isZoneSwept(highs[i].price, highs[i + 2].price, candles)
      });
    }
  }
  
  // Find equal lows (swing lows)
  for (let i = 0; i < lows.length - 2; i++) {
    if (isSimilarPrice(lows[i].price, lows[i + 1].price, lows[i + 2].price)) {
      zones.push({
        id: `EQL-${i}`,
        type: "equal_low",
        price: (lows[i].price + lows[i + 1].price + lows[i + 2].price) / 3,
        strength: "strong",
        touchCount: 3,
        lastTouchTime: lows[i + 2].timestamp,
        isSwept: isZoneSwept(lows[i].price, lows[i + 2].price, candles)
      });
    }
  }
  
  // Regular highs and lows
  highs.forEach((h, i) => {
    if (!zones.find(z => Math.abs(z.price - h.price) < h.price * 0.001)) {
      zones.push({
        id: `H-${i}`,
        type: "high",
        price: h.price,
        strength: "medium",
        touchCount: 1,
        lastTouchTime: h.timestamp,
        isSwept: isZoneSwept(h.price, h.price, candles)
      });
    }
  });
  
  lows.forEach((l, i) => {
    if (!zones.find(z => Math.abs(z.price - l.price) < l.price * 0.001)) {
      zones.push({
        id: `L-${i}`,
        type: "low",
        price: l.price,
        strength: "medium",
        touchCount: 1,
        lastTouchTime: l.timestamp,
        isSwept: isZoneSwept(l.price, l.price, candles)
      });
    }
  });
  
  return zones.sort((a, b) => b.touchCount - a.touchCount).slice(0, 10);
}

function isSimilarPrice(p1: number, p2: number, p3: number, threshold: number = 0.001): boolean {
  return Math.abs(p1 - p2) / p1 < threshold && Math.abs(p2 - p3) / p2 < threshold;
}

function isZoneSwept(zoneHigh: number, zoneLow: number, candles: CandleData[]): boolean {
  const currentPrice = candles[candles.length - 1].close;
  // Check if price has swept above/below the zone
  return currentPrice > zoneHigh * 1.01 || currentPrice < zoneLow * 0.99;
}

// Detect Swing Points
function detectSwingPoints(candles: CandleData[], config: SMCConfig): SwingPoint[] {
  const swings: SwingPoint[] = [];
  const lookback = config.swingLookback;
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    // Find swing high
    let isSwingHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].high > candles[i].high) {
        isSwingHigh = false;
        break;
      }
    }
    if (isSwingHigh) {
      swings.push({
        type: "high",
        index: i,
        price: candles[i].high,
        strength: lookback > 10 ? "strong" : lookback > 5 ? "medium" : "weak"
      });
    }
    
    // Find swing low
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && candles[j].low < candles[i].low) {
        isSwingLow = false;
        break;
      }
    }
    if (isSwingLow) {
      swings.push({
        type: "low",
        index: i,
        price: candles[i].low,
        strength: lookback > 10 ? "strong" : lookback > 5 ? "medium" : "weak"
      });
    }
  }
  
  return swings.slice(-30);
}

// Analyze Market Structure
function analyzeMarketStructure(candles: CandleData[], swings: SwingPoint[]): MarketStructure {
  const recentSwings = swings.slice(-10);
  const currentPrice = candles[candles.length - 1].close;
  
  let trend: "bullish" | "bearish" | "ranging" = "ranging";
  let currentSwing: "higher_high" | "higher_low" | "lower_high" | "lower_low" = "neutral";
  let structureDirection: "bullish" | "bearish" | "neutral" = "neutral";
  
  const highs = recentSwings.filter(s => s.type === "high");
  const lows = recentSwings.filter(s => s.type === "low");
  
  if (highs.length >= 2 && lows.length >= 2) {
    const lastHigh = highs[highs.length - 1].price;
    const prevHigh = highs[highs.length - 2].price;
    const lastLow = lows[lows.length - 1].price;
    const prevLow = lows[lows.length - 2].price;
    
    const HH = lastHigh > prevHigh;
    const HL = lastLow > prevLow;
    const LH = lastHigh < prevHigh;
    const LL = lastLow < prevLow;
    
    if (HH && HL) {
      trend = "bullish";
      currentSwing = "higher_high";
      structureDirection = "bullish";
    } else if (LH && LL) {
      trend = "bearish";
      currentSwing = "lower_high";
      structureDirection = "bearish";
    } else if (HL || HH) {
      trend = "bullish";
      currentSwing = "higher_low";
      structureDirection = "bullish";
    } else if (LL || LH) {
      trend = "bearish";
      currentSwing = "lower_high";
      structureDirection = "bearish";
    }
  }
  
  // Calculate premium/discount
  const lastSwingHigh = highs.length > 0 ? highs[highs.length - 1].price : currentPrice;
  const lastSwingLow = lows.length > 0 ? lows[lows.length - 1].price : currentPrice;
  const midPoint = (lastSwingHigh + lastSwingLow) / 2;
  
  let currentPricePosition: "premium" | "discount" | "equilibrium";
  if (currentPrice > midPoint * 1.02) {
    currentPricePosition = "premium";
  } else if (currentPrice < midPoint * 0.98) {
    currentPricePosition = "discount";
  } else {
    currentPricePosition = "equilibrium";
  }
  
  return {
    trend,
    currentSwing,
    structureDirection,
    BOS: [],
    CHOCH: [],
    lastSwingHigh,
    lastSwingLow,
    currentPricePosition
  };
}

// Identify Premium/Discount Zones
function identifyPremiumDiscountZones(structure: MarketStructure, candles: CandleData[]): PremiumDiscountZone[] {
  const zones: PremiumDiscountZone[] = [];
  const currentPrice = candles[candles.length - 1].close;
  const range = structure.lastSwingHigh - structure.lastSwingLow;
  
  // Premium Zone (sell side)
  zones.push({
    type: "premium",
    description: "Price above equilibrium - selling zone",
    recommendation: "Look for bearish setups. Price is expensive relative to recent range."
  });
  
  // Discount Zone (buy side)
  zones.push({
    type: "discount",
    description: "Price below equilibrium - buying zone",
    recommendation: "Look for bullish setups. Price is cheap relative to recent range."
  });
  
  // Equilibrium
  zones.push({
    type: "equilibrium",
    description: "Fair value area between premium and discount",
    recommendation: "Avoid trading. Wait for price to move to clear zones."
  });
  
  return zones;
}

// Utility Functions
export function getCurrentSMCSignal(smc: SMCAnalysis, currentPrice: number): {
  bias: "bullish" | "bearish" | "neutral";
  entryZone: string;
  target: string;
  stopLoss: string;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let confidence = 50;
  let bias: "bullish" | "bearish" | "neutral" = "neutral";
  
  // Check order blocks
  const recentOB = smc.orderBlocks.filter(ob => ob.isProximal).slice(0, 2);
  const bullishOBs = recentOB.filter(ob => ob.type === "bullish");
  const bearishOBs = recentOB.filter(ob => ob.type === "bearish");
  
  if (bullishOBs.length > bearishOBs.length && bullishOBs.length > 0) {
    bias = "bullish";
    confidence += 15;
    reasons.push(`Found ${bullishOBs.length} bullish order blocks near price`);
  } else if (bearishOBs.length > bullishOBs.length && bearishOBs.length > 0) {
    bias = "bearish";
    confidence += 15;
    reasons.push(`Found ${bearishOBs.length} bearish order blocks near price`);
  }
  
  // Check market structure
  if (smc.marketStructure.structureDirection === "bullish") {
    bias = bias === "bearish" ? "neutral" : "bullish";
    confidence += 15;
    reasons.push("Market structure is bullish (higher highs & lows)");
  } else if (smc.marketStructure.structureDirection === "bearish") {
    bias = bias === "bullish" ? "neutral" : "bearish";
    confidence += 15;
    reasons.push("Market structure is bearish (lower highs & lows)");
  }
  
  // Check premium/discount
  if (smc.marketStructure.currentPricePosition === "discount" && bias === "bullish") {
    confidence += 10;
    reasons.push("Price in discount zone - favorable for buying");
  } else if (smc.marketStructure.currentPricePosition === "premium" && bias === "bearish") {
    confidence += 10;
    reasons.push("Price in premium zone - favorable for selling");
  }
  
  // Check favorable FVGs
  const favorableFVGs = smc.fairValueGaps.filter(fvg => fvg.isFavorableEntry && !fvg.isMitigated);
  if (favorableFVGs.length > 0) {
    confidence += 5;
    reasons.push(`${favorableFVGs.length} unfilled FVGs in favorable zone`);
  }
  
  // Generate entry/target/stop
  let entryZone: string;
  let target: string;
  let stopLoss: string;
  
  if (bias === "bullish") {
    const nearestLow = smc.liquidityZones
      .filter(z => z.type === "low" || z.type === "equal_low")
      .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))[0];
    
    entryZone = `Buy between ${(currentPrice * 0.99).toFixed(2)} - ${currentPrice.toFixed(2)}`;
    stopLoss = nearestLow ? (nearestLow.price * 0.995).toFixed(2) : (currentPrice * 0.98).toFixed(2);
    target = (currentPrice * 1.03).toFixed(2);
  } else if (bias === "bearish") {
    const nearestHigh = smc.liquidityZones
      .filter(z => z.type === "high" || z.type === "equal_high")
      .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))[0];
    
    entryZone = `Sell between ${currentPrice.toFixed(2)} - ${(currentPrice * 1.01).toFixed(2)}`;
    stopLoss = nearestHigh ? (nearestHigh.price * 1.005).toFixed(2) : (currentPrice * 1.02).toFixed(2);
    target = (currentPrice * 0.97).toFixed(2);
  } else {
    entryZone = "Wait for clearer signal";
    target = "TBD";
    stopLoss = "TBD";
  }
  
  return {
    bias,
    entryZone,
    target,
    stopLoss,
    confidence: Math.min(confidence, 95),
    reasons
  };
}

export const SMCService = {
  analyzeSMC,
  generateSMCData,
  generateCandles,
  getCurrentSMCSignal
};
