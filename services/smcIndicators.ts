/**
 * SMC (Smart Money Concepts) Indicator Service
 * 
 * Implements ICT trading concepts including:
 * - Order Blocks
 * - Fair Value Gaps (FVGs)
 * - Liquidity Zones
 * - Market Structure (BOS, CHOCH, MSS)
 * - Premium/Discount Analysis
 * - Optimal Trade Entry (OTE)
 */

import { OHLCV } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface OrderBlock {
  /** Type of order block */
  type: "Bullish" | "Bearish";
  /** Candle index where order block starts */
  startIndex: number;
  /** Candle index where order block ends */
  endIndex: number;
  /** High price of the order block zone */
  high: number;
  /** Low price of the order block zone */
  low: number;
  /** Quality ranking based on confluence */
  quality: "High" | "Medium" | "Low";
  /** Position relative to move */
  discountPremium: "Discount" | "Premium" | "Equilibrium";
  /** Whether FVG exists within/below/above */
  hasFVG: boolean;
  /** Whether liquidity is nearby */
  hasLiquidity: boolean;
  /** Timestamp for reference */
  timestamp: number;
}

export interface FairValueGap {
  /** Type of FVG */
  type: "Bullish" | "Bearish";
  /** Candle index where FVG starts */
  startIndex: number;
  /** Candle index where FVG ends */
  endIndex: number;
  /** High price (for bullish) or low price (for bearish) */
  priceLevel: number;
  /** Gap size in pips/points */
  size: number;
  /** Strength ranking */
  strength: "Strong" | "Medium" | "Weak";
  /** Whether price has returned to fill this gap */
  mitigated: boolean;
  /** Mitigation price if mitigated */
  mitigationPrice?: number;
  /** Timestamp */
  timestamp: number;
}

export interface LiquidityZone {
  /** Type of liquidity */
  type: "SwingHigh" | "SwingLow" | "RoundNumber" | "FractalHigh" | "FractalLow" | "DayHigh" | "DayLow" | "WeekHigh" | "WeekLow";
  /** Price level */
  price: number;
  /** Strength based on touches */
  strength: number;
  /** Number of times tested */
  grabCount: number;
  /** Whether liquidity has been grabbed */
  grabbed: boolean;
  /** Timestamp of last test */
  lastTested: number;
}

export interface BreakOfStructure {
  /** Direction of BOS */
  type: "Bullish" | "Bearish";
  /** Index where BOS occurred */
  index: number;
  /** Price level of BOS */
  price: number;
  /** Previous swing point */
  previousSwing: number;
  /** Confidence level */
  confidence: number;
  /** Whether this confirmed trend continuation */
  trendContinuation: boolean;
}

export interface ChangeOfCharacter {
  /** Direction of CHOCH */
  type: "Bullish" | "Bearish";
  /** Index where CHOCH occurred */
  index: number;
  /** Price level */
  price: number;
  /** Supply/Demand zone that was broken */
  zoneType: "Supply" | "Demand";
  /** Confidence level */
  confidence: number;
  /** Indicates potential trend reversal */
  reversalSignal: boolean;
}

export interface MarketStructureShift {
  /** Direction of MSS */
  type: "Bullish" | "Bearish";
  /** Index where MSS occurred */
  index: number;
  /** Price level */
  price: number;
  /** Extreme zone that was broken */
  zoneType: "Demand" | "Supply";
  /** Confidence level */
  confidence: number;
}

export interface PremiumDiscountResult {
  position: "Premium" | "Discount" | "Equilibrium";
  percentage: number;
  entryPrice: number;
  moveOrigin: number;
  moveExtreme: number;
  description: string;
}

export interface OTEResult {
  entryPrice: number;
  fibLevel: number;
  zoneDescription: string;
  riskRewardFavorable: boolean;
}

export interface SMCAnalysis {
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  liquidityZones: LiquidityZone[];
  bos: BreakOfStructure[];
  choch?: ChangeOfCharacter;
  mss?: MarketStructureShift;
  currentBias: "Bullish" | "Bearish" | "Neutral";
  trendStrength: number;
  premiumDiscount: PremiumDiscountResult;
  optimalEntry?: OTEResult;
}

// ============================================================================
// SWING DETECTION
// ============================================================================

/**
 * Find swing highs and lows using a lookback period
 */
function findSwings(ohlcv: OHLCV[], lookback: number = 5): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  
  for (let i = lookback; i < ohlcv.length - lookback; i++) {
    // Check for swing high
    let isHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (ohlcv[i].high <= ohlcv[i + j].high || ohlcv[i].high <= ohlcv[i - j].high) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) highs.push(i);
    
    // Check for swing low
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (ohlcv[i].low >= ohlcv[i + j].low || ohlcv[i].low >= ohlcv[i - j].low) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows.push(i);
  }
  
  return { highs, lows };
}

/**
 * Find the most recent swing point before a given index
 */
function findRecentSwing(ohlcv: OHLCV[], currentIndex: number, type: "high" | "low", lookback: number = 20): number {
  for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - lookback); i--) {
    let isSwing = true;
    for (let j = 1; j <= 5; j++) {
      if (i - j < 0 || i + j >= ohlcv.length) continue;
      if (type === "high") {
        if (ohlcv[i].high <= ohlcv[i + j].high || ohlcv[i].high <= ohlcv[i - j].high) {
          isSwing = false;
          break;
        }
      } else {
        if (ohlcv[i].low >= ohlcv[i + j].low || ohlcv[i].low >= ohlcv[i - j].low) {
          isSwing = false;
          break;
        }
      }
    }
    if (isSwing) return ohlcv[i].close;
  }
  return type === "high" ? ohlcv[currentIndex - 1].high : ohlcv[currentIndex - 1].low;
}

// ============================================================================
// ORDER BLOCK DETECTION
// ============================================================================

/**
 * Detect order blocks in price action
 * 
 * Order blocks are areas where institutional orders were accumulated/distributed
 * before a significant move. They appear as the last candle before a displacement.
 */
export function detectOrderBlocks(ohlcv: OHLCV[]): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];
  if (ohlcv.length < 10) return orderBlocks;

  const { highs, lows } = findSwings(ohlcv, 5);
  
  for (let i = 5; i < ohlcv.length - 5; i++) {
    // Look for displacement (strong move)
    const displacementCandle = ohlcv[i];
    const nextCandles = ohlcv.slice(i + 1, i + 5);
    const prevCandles = ohlcv.slice(i - 5, i);
    
    // Calculate average body size
    const avgBodySize = ohlcv.slice(-50).reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 50;
    
    // Check for bullish order block (bearish candle before bullish displacement)
    if (displacementCandle.close < displacementCandle.open) { // Bearish candle
      const hasStrongMoveUp = nextCandles.some(c => 
        (c.close - c.open) > avgBodySize * 1.5 && c.close > c.open
      );
      
      if (hasStrongMoveUp) {
        const isNearLow = lows.some(l => Math.abs(ohlcv[l].low - displacementCandle.low) < avgBodySize * 3);
        
        orderBlocks.push({
          type: "Bullish",
          startIndex: i - 3,
          endIndex: i,
          high: displacementCandle.high,
          low: displacementCandle.low,
          quality: isNearLow ? "High" : "Medium",
          discountPremium: isNearLow ? "Discount" : "Equilibrium",
          hasFVG: false, // Will be checked separately
          hasLiquidity: isNearLow,
          timestamp: ohlcv[i].timestamp
        });
      }
    }
    
    // Check for bearish order block (bullish candle before bearish displacement)
    if (displacementCandle.close > displacementCandle.open) { // Bullish candle
      const hasStrongMoveDown = nextCandles.some(c => 
        (c.open - c.close) > avgBodySize * 1.5 && c.close < c.open
      );
      
      if (hasStrongMoveDown) {
        const isNearHigh = highs.some(h => Math.abs(ohlcv[h].high - displacementCandle.high) < avgBodySize * 3);
        
        orderBlocks.push({
          type: "Bearish",
          startIndex: i - 3,
          endIndex: i,
          high: displacementCandle.high,
          low: displacementCandle.low,
          quality: isNearHigh ? "High" : "Medium",
          discountPremium: isNearHigh ? "Premium" : "Equilibrium",
          hasFVG: false,
          hasLiquidity: isNearHigh,
          timestamp: ohlcv[i].timestamp
        });
      }
    }
  }
  
  return orderBlocks;
}

// ============================================================================
// FAIR VALUE GAP DETECTION
// ============================================================================

/**
 * Detect Fair Value Gaps (imbalances) in price action
 * 
 * FVG is a 3-candle pattern where there's a gap between the wicks
 * of candles 1 and 3. Indicates inefficiencies the market tends to fill.
 */
export function detectFVGs(ohlcv: OHLCV[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  if (ohlcv.length < 3) return fvgs;

  const avgBodySize = ohlcv.slice(-50).reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / 50;

  for (let i = 2; i < ohlcv.length; i++) {
    const candle1 = ohlcv[i - 2];
    const candle2 = ohlcv[i - 1];
    const candle3 = ohlcv[i];

    // Check for bullish FVG (gap between candle1 low and candle3 low)
    const bullishGap = candle1.low - candle3.low;
    const isBullishFVG = 
      candle1.close > candle1.open && // Candle 1 is bullish
      candle3.close > candle3.open && // Candle 3 is bullish
      candle1.low > candle3.low &&    // Gap exists
      bullishGap > avgBodySize;        // Significant gap

    // Check for bearish FVG (gap between candle1 high and candle3 high)
    const bearishGap = candle3.high - candle1.high;
    const isBearishFVG = 
      candle1.close < candle1.open && // Candle 1 is bearish
      candle3.close < candle3.open && // Candle 3 is bearish
      candle3.high > candle1.high &&  // Gap exists
      bearishGap > avgBodySize;       // Significant gap

    if (isBullishFVG) {
      // Check if mitigated
      const mitigated = ohlcv.slice(i + 1).some(c => c.low <= candle3.low);
      
      fvgs.push({
        type: "Bullish",
        startIndex: i - 2,
        endIndex: i,
        priceLevel: candle3.low,
        size: bullishGap,
        strength: bullishGap > avgBodySize * 2 ? "Strong" : bullishGap > avgBodySize * 1.5 ? "Medium" : "Weak",
        mitigated,
        mitigationPrice: mitigated ? candle3.low : undefined,
        timestamp: candle3.timestamp
      });
    }

    if (isBearishFVG) {
      // Check if mitigated
      const mitigated = ohlcv.slice(i + 1).some(c => c.high >= candle3.high);
      
      fvgs.push({
        type: "Bearish",
        startIndex: i - 2,
        endIndex: i,
        priceLevel: candle3.high,
        size: bearishGap,
        strength: bearishGap > avgBodySize * 2 ? "Strong" : bearishGap > avgBodySize * 1.5 ? "Medium" : "Weak",
        mitigated,
        mitigationPrice: mitigated ? candle3.high : undefined,
        timestamp: candle3.timestamp
      });
    }
  }

  return fvgs;
}

// ============================================================================
// LIQUIDITY ZONE DETECTION
// ============================================================================

/**
 * Detect liquidity zones where stop orders tend to cluster
 */
export function detectLiquidityZones(ohlcv: OHLCV[]): LiquidityZone[] {
  const zones: LiquidityZone[] = [];
  if (ohlcv.length < 10) return zones;

  const { highs, lows } = findSwings(ohlcv, 5);
  const avgRange = ohlcv.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / 20;

  // Detect swing highs as sell-side liquidity
  highs.forEach((idx, touchCount) => {
    const price = ohlcv[idx].high;
    
    // Check if this is a round number liquidity zone
    const isRoundNumber = price % 1 === 0 || price % 10 === 0;
    
    // Check if liquidity has been grabbed recently
    const grabbed = ohlcv.slice(idx + 1).some(c => c.low <= price - avgRange * 0.5);
    
    // Calculate strength based on fractal alignment
    let strength = 50;
    highs.forEach(h => {
      if (Math.abs(ohlcv[h].high - price) < avgRange * 0.5) strength += 10;
    });

    zones.push({
      type: isRoundNumber ? "RoundNumber" : "SwingHigh",
      price,
      strength: Math.min(strength, 100),
      grabCount: touchCount + 1,
      grabbed,
      lastTested: ohlcv[idx].timestamp
    });
  });

  // Detect swing lows as buy-side liquidity
  lows.forEach((idx, touchCount) => {
    const price = ohlcv[idx].low;
    
    const isRoundNumber = price % 1 === 0 || price % 10 === 0;
    const grabbed = ohlcv.slice(idx + 1).some(c => c.high >= price + avgRange * 0.5);
    
    let strength = 50;
    lows.forEach(l => {
      if (Math.abs(ohlcv[l].low - price) < avgRange * 0.5) strength += 10;
    });

    zones.push({
      type: isRoundNumber ? "RoundNumber" : "SwingLow",
      price,
      strength: Math.min(strength, 100),
      grabCount: touchCount + 1,
      grabbed,
      lastTested: ohlcv[idx].timestamp
    });
  });

  // Detect day/week highs and lows
  const dayHigh = Math.max(...ohlcv.slice(-1).map(c => c.high));
  const dayLow = Math.min(...ohlcv.slice(-1).map(c => c.low));
  
  zones.push({
    type: "DayHigh",
    price: dayHigh,
    strength: 70,
    grabCount: 0,
    grabbed: false,
    lastTested: ohlcv[ohlcv.length - 1].timestamp
  });
  
  zones.push({
    type: "DayLow",
    price: dayLow,
    strength: 70,
    grabCount: 0,
    grabbed: false,
    lastTested: ohlcv[ohlcv.length - 1].timestamp
  });

  return zones;
}

// ============================================================================
// BREAK OF STRUCTURE DETECTION
// ============================================================================

/**
 * Detect Break of Structure (BOS) - confirms trend continuation
 */
export function detectBOS(ohlcv: OHLCV[]): BreakOfStructure[] {
  const bosList: BreakOfStructure[] = [];
  if (ohlcv.length < 20) return bosList;

  const { highs, lows } = findSwings(ohlcv, 5);

  // Add bounds checking
  if (highs.length < 3 || lows.length < 3) return bosList;

  // Bullish BOS: Price breaks above previous high with pullback
  for (let i = 10; i < highs.length - 1 && i < highs.length; i++) {
    if (i >= ohlcv.length) break;
    const currentHigh = ohlcv[highs[i]]?.high;
    const previousHigh = ohlcv[highs[i - 1]]?.high;
    if (currentHigh === undefined || previousHigh === undefined) continue;

    if (currentHigh > previousHigh) {
      // Check if there's a higher low (pullback)
      const previousHighIndex = highs[i - 1];
      if (previousHighIndex === undefined) continue;

      const previousHighTimestamp = ohlcv[previousHighIndex]?.timestamp;
      if (previousHighTimestamp === undefined) continue;

      const recentLows = lows.filter(l => ohlcv[l]?.timestamp && ohlcv[l].timestamp > previousHighTimestamp);
      const previousSwingLow = findRecentSwing(ohlcv, previousHighIndex, "low", 20);

      const hasHigherLow = recentLows.some(l => {
        const lowPrice = ohlcv[l]?.low;
        return lowPrice !== undefined && lowPrice > previousSwingLow;
      });

      if (hasHigherLow) {
        bosList.push({
          type: "Bullish",
          index: highs[i],
          price: currentHigh,
          previousSwing: previousHigh,
          confidence: 80,
          trendContinuation: true
        });
      }
    }
  }

  // Bearish BOS: Price breaks below previous low with pullback
  for (let i = 10; i < lows.length - 1 && i < lows.length; i++) {
    if (i >= ohlcv.length) break;
    const currentLow = ohlcv[lows[i]]?.low;
    const previousLow = ohlcv[lows[i - 1]]?.low;
    if (currentLow === undefined || previousLow === undefined) continue;

    if (currentLow < previousLow) {
      // Check if there's a lower high (pullback)
      const previousLowIndex = lows[i - 1];
      if (previousLowIndex === undefined) continue;

      const previousLowTimestamp = ohlcv[previousLowIndex]?.timestamp;
      if (previousLowTimestamp === undefined) continue;

      const recentHighs = highs.filter(h => ohlcv[h]?.timestamp && ohlcv[h].timestamp > previousLowTimestamp);
      const previousSwingHigh = findRecentSwing(ohlcv, previousLowIndex, "high", 20);

      const hasLowerHigh = recentHighs.some(h => {
        const highPrice = ohlcv[h]?.high;
        return highPrice !== undefined && highPrice < previousSwingHigh;
      });

      if (hasLowerHigh) {
        bosList.push({
          type: "Bearish",
          index: lows[i],
          price: currentLow,
          previousSwing: previousLow,
          confidence: 80,
          trendContinuation: true
        });
      }
    }
  }

  return bosList;
}

// ============================================================================
// CHANGE OF CHARACTER DETECTION
// ============================================================================

/**
 * Detect Change of Character (CHOCH) - signals potential trend reversal
 */
export function detectCHOCH(ohlcv: OHLCV[]): ChangeOfCharacter | undefined {
  if (ohlcv.length < 30) return undefined;

  const { highs, lows } = findSwings(ohlcv, 5);
  const avgRange = ohlcv.slice(-20).reduce((sum, c) => sum + (c.high - c.low), 0) / 20;

  // Bullish CHOCH: In a downtrend, price breaks above extreme demand zone
  // Looking for shift from bearish to bullish structure
  const recentLows = lows.slice(-10);
  const extremeDemand = Math.min(...recentLows.map(l => ohlcv[l].low));
  
  const recentHighs = highs.slice(-10);
  if (recentHighs.length > 2) {
    const lastHigh = ohlcv[recentHighs[recentHighs.length - 1]].high;
    const secondLastHigh = ohlcv[recentHighs[recentHighs.length - 2]].high;
    
    // If in downtrend (lower highs) and price breaks above
    if (lastHigh > secondLastHigh) {
      const recentSwingHigh = findRecentSwing(ohlcv, recentHighs[recentHighs.length - 2], "high", 20);
      const lastSwingLow = findRecentSwing(ohlcv, recentHighs[recentHighs.length - 1], "low", 20);
      
      // Check if we're coming from bearish structure
      if (extremeDemand < lastSwingLow) {
        return {
          type: "Bullish",
          index: recentHighs[recentHighs.length - 1],
          price: lastHigh,
          zoneType: "Demand",
          confidence: 75,
          reversalSignal: true
        };
      }
    }
  }

  // Bearish CHOCH: In an uptrend, price breaks below extreme supply zone
  const recentHighs2 = highs.slice(-10);
  const extremeSupply = Math.max(...recentHighs2.map(h => ohlcv[h].high));
  
  const recentLows2 = lows.slice(-10);
  if (recentLows2.length > 2) {
    const lastLow = ohlcv[recentLows2[recentLows2.length - 1]].low;
    const secondLastLow = ohlcv[recentLows2[recentLows2.length - 2]].low;
    
    // If in uptrend (higher lows) and price breaks below
    if (lastLow < secondLastLow) {
      const recentSwingLow = findRecentSwing(ohlcv, recentLows2[recentLows2.length - 2], "low", 20);
      const lastSwingHigh = findRecentSwing(ohlcv, recentLows2[recentLows2.length - 1], "high", 20);
      
      if (extremeSupply > lastSwingHigh) {
        return {
          type: "Bearish",
          index: recentLows2[recentLows2.length - 1],
          price: lastLow,
          zoneType: "Supply",
          confidence: 75,
          reversalSignal: true
        };
      }
    }
  }

  return undefined;
}

// ============================================================================
// MARKET STRUCTURE SHIFT DETECTION
// ============================================================================

/**
 * Detect Market Structure Shift (MSS) - confirms order flow change
 */
export function detectMSS(ohlcv: OHLCV[]): MarketStructureShift | undefined {
  if (ohlcv.length < 30) return undefined;

  const { highs, lows } = findSwings(ohlcv, 5);

  // Bullish MSS: Price breaks below demand zone (doesn't require prior BOS)
  const recentLows = lows.slice(-15);
  if (recentLows.length >= 3) {
    const extremeDemand = Math.min(...recentLows.map(l => ohlcv[l].low));
    const recentCandleLow = ohlcv[ohlcv.length - 1].low;
    
    if (recentCandleLow < extremeDemand - (ohlcv[ohlcv.length - 1].high - ohlcv[ohlcv.length - 1].low)) {
      return {
        type: "Bullish",
        index: ohlcv.length - 1,
        price: recentCandleLow,
        zoneType: "Demand",
        confidence: 70
      };
    }
  }

  // Bearish MSS: Price breaks above supply zone (doesn't require prior BOS)
  const recentHighs = highs.slice(-15);
  if (recentHighs.length >= 3) {
    const extremeSupply = Math.max(...recentHighs.map(h => ohlcv[h].high));
    const recentCandleHigh = ohlcv[ohlcv.length - 1].high;
    
    if (recentCandleHigh > extremeSupply + (ohlcv[ohlcv.length - 1].high - ohlcv[ohlcv.length - 1].low)) {
      return {
        type: "Bearish",
        index: ohlcv.length - 1,
        price: recentCandleHigh,
        zoneType: "Supply",
        confidence: 70
      };
    }
  }

  return undefined;
}

// ============================================================================
// PREMIUM/DISCOUNT ANALYSIS
// ============================================================================

/**
 * Calculate premium/discount position for entry pricing
 * 
 * Premium = Upper half of move (riskier, further from stop)
 * Discount = Lower half of move (better risk/reward, closer to stop)
 */
export function calculatePremiumDiscount(
  ohlcv: OHLCV[],
  entryPrice: number
): PremiumDiscountResult {
  if (ohlcv.length < 2) {
    return {
      position: "Equilibrium",
      percentage: 0,
      entryPrice,
      moveOrigin: entryPrice,
      moveExtreme: entryPrice,
      description: "Insufficient data"
    };
  }

  // Find the most recent significant move
  const { highs, lows } = findSwings(ohlcv, 5);
  
  let moveOrigin: number;
  let moveExtreme: number;
  
  if (highs.length > lows.length) {
    // Bullish bias - looking for upward move
    const recentSwingLow = lows.length > 0 ? ohlcv[lows[lows.length - 1]].low : ohlcv[ohlcv.length - 5].low;
    const recentSwingHigh = highs.length > 0 ? ohlcv[highs[highs.length - 1]].high : ohlcv[ohlcv.length - 1].high;
    moveOrigin = recentSwingLow;
    moveExtreme = recentSwingHigh;
  } else {
    // Bearish bias - looking for downward move
    const recentSwingHigh = highs.length > 0 ? ohlcv[highs[highs.length - 1]].high : ohlcv[ohlcv.length - 5].high;
    const recentSwingLow = lows.length > 0 ? ohlcv[lows[lows.length - 1]].low : ohlcv[ohlcv.length - 1].low;
    moveOrigin = recentSwingHigh;
    moveExtreme = recentSwingLow;
  }

  const moveSize = Math.abs(moveOrigin - moveExtreme);
  if (moveSize === 0) {
    return {
      position: "Equilibrium",
      percentage: 50,
      entryPrice,
      moveOrigin,
      moveExtreme,
      description: "No clear move direction"
    };
  }

  // Calculate position within the move
  const distanceFromOrigin = Math.abs(entryPrice - moveOrigin);
  const percentage = (distanceFromOrigin / moveSize) * 100;
  
  let position: "Premium" | "Discount" | "Equilibrium";
  let description: string;
  
  if (percentage < 40) {
    position = "Discount";
    description = "Optimal entry zone - closer to stop loss, better R:R";
  } else if (percentage > 60) {
    position = "Premium";
    description = "Higher risk entry - further from stop loss";
  } else {
    position = "Equilibrium";
    description = "Mid-range entry - neutral risk/reward";
  }

  return {
    position,
    percentage: Math.round(percentage),
    entryPrice,
    moveOrigin,
    moveExtreme,
    description
  };
}

// ============================================================================
// OPTIMAL TRADE ENTRY (OTE) CALCULATION
// ============================================================================

/**
 * Calculate Optimal Trade Entry using Fibonacci retracement
 * 
 * OTE typically falls between 61.8% and 79% retracement
 * Most powerful zone is around 70.5%
 */
export function calculateOTE(
  ohlcv: OHLCV[],
  swingHigh: number,
  swingLow: number
): OTEResult | undefined {
  if (ohlcv.length < 10 || swingHigh <= swingLow) return undefined;

  const moveSize = swingHigh - swingLow;
  
  // OTE Fibonacci levels
  const fib618 = swingLow + moveSize * 0.618;
  const fib705 = swingLow + moveSize * 0.705;
  const fib79 = swingLow + moveSize * 0.79;
  
  // Current price
  const currentPrice = ohlcv[ohlcv.length - 1].close;
  
  // Determine entry zone
  let zoneDescription: string;
  let fibLevel: number;
  
  if (currentPrice <= fib618) {
    zoneDescription = "Below OTE zone - waiting for retracement";
    fibLevel = 0.618;
  } else if (currentPrice >= fib79) {
    zoneDescription = "Above OTE zone - missed entry";
    fibLevel = 0.79;
  } else if (currentPrice >= fib705) {
    zoneDescription = "Optimal zone (70.5%) - high probability entry";
    fibLevel = 0.705;
  } else {
    zoneDescription = "OTE zone active (61.8%-70.5%) - good entry forming";
    fibLevel = 0.618;
  }

  // Check if R:R is favorable (entry to swing extreme)
  const distanceToExtreme = Math.abs(swingHigh - currentPrice);
  const riskRewardFavorable = distanceToExtreme >= moveSize * 1.5;

  return {
    entryPrice: fib705,
    fibLevel,
    zoneDescription,
    riskRewardFavorable
  };
}

// ============================================================================
// COMPREHENSIVE SMC ANALYSIS
// ============================================================================

/**
 * Run complete SMC analysis on OHLCV data
 */
export function runSMCAnalysis(ohlcv: OHLCV[], currentPrice: number): SMCAnalysis {
  const orderBlocks = detectOrderBlocks(ohlcv);
  const fairValueGaps = detectFVGs(ohlcv);
  const liquidityZones = detectLiquidityZones(ohlcv);
  const bos = detectBOS(ohlcv);
  const choch = detectCHOCH(ohlcv);
  const mss = detectMSS(ohlcv);
  const premiumDiscount = calculatePremiumDiscount(ohlcv, currentPrice);
  
  // Determine current bias based on recent structure
  let currentBias: "Bullish" | "Bearish" | "Neutral" = "Neutral";
  const trendStrength = Math.min(bos.length * 10, 100);
  
  const recentBOS = bos.slice(-5);
  if (recentBOS.length > 0) {
    const bullishCount = recentBOS.filter(b => b.type === "Bullish").length;
    const bearishCount = recentBOS.filter(b => b.type === "Bearish").length;
    
    if (bullishCount > bearishCount) {
      currentBias = "Bullish";
    } else if (bearishCount > bullishCount) {
      currentBias = "Bearish";
    }
  }

  // Check for CHOCH which indicates potential reversal
  if (choch) {
    currentBias = choch.type;
  }

  // Calculate OTE
  const { highs, lows } = findSwings(ohlcv, 5);
  let optimalEntry: OTEResult | undefined;
  if (highs.length > 0 && lows.length > 0) {
    const lastSwingHigh = ohlcv[highs[highs.length - 1]].high;
    const lastSwingLow = ohlcv[lows[lows.length - 1]].low;
    optimalEntry = calculateOTE(ohlcv, lastSwingHigh, lastSwingLow);
  }

  return {
    orderBlocks,
    fairValueGaps,
    liquidityZones,
    bos,
    choch,
    mss,
    currentBias,
    trendStrength,
    premiumDiscount,
    optimalEntry
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the most recent unfilled order block
 */
export function getRecentOrderBlock(ohlcv: OHLCV[]): OrderBlock | undefined {
  const orderBlocks = detectOrderBlocks(ohlcv);
  const currentPrice = ohlcv[ohlcv.length - 1].close;
  
  return orderBlocks
    .filter(ob => {
      if (ob.type === "Bullish") {
        return currentPrice > ob.low && currentPrice < ob.high;
      } else {
        return currentPrice < ob.high && currentPrice > ob.low;
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}

/**
 * Get the most recent unfilled FVG
 */
export function getRecentFVG(ohlcv: OHLCV[]): FairValueGap | undefined {
  const fvgs = detectFVGs(ohlcv);
  return fvgs
    .filter(fvg => !fvg.mitigated)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}

/**
 * Check if price is in kill zone
 */
export function isInActiveKillZone(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const estHour = (hour - 5 + 24) % 24; // Approximate EST
  
  // Kill zones (EST)
  const asian = estHour >= 20 || estHour < 24 || estHour < 0; // 8PM-12AM
  const london = estHour >= 2 && estHour < 5; // 2AM-5AM
  const nyOpen = estHour >= 7 && estHour < 10; // 7AM-10AM
  const londonClose = estHour >= 10 && estHour < 12; // 10AM-12PM
  
  return asian || london || nyOpen || londonClose;
}
