/**
 * Arbitrage Trading Service
 * 
 * Implements various arbitrage strategies:
 * - Spatial Arbitrage (price differences between exchanges)
 * - Triangular Arbitrage (forex/crypto)
 * - Statistical Arbitrage (correlation-based)
 * - Merger Arbitrage
 * 
 * Note: This is for analysis and strategy generation only.
 * Actual execution requires sophisticated infrastructure.
 */

import { OHLCV, TradeSetup, Quote } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export interface PriceData {
  symbol: string;
  exchange: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  timestamp: number;
}

export interface ArbitrageOpportunity {
  id: string;
  type: "spatial" | "triangular" | "statistical" | "merger";
  symbol: string;
  exchanges: string[];
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  profitPercent: number; // After fees
  confidence: number;
  timestamp: number;
  expiry: number; // When opportunity likely expires
  requiresExecution: boolean; // True if requires automated execution
}

export interface ArbitrageConfig {
  minSpreadPercent: number; // Minimum spread to consider
  maxExecutionTime: number; // Max milliseconds to execute
  feePercent: number; // Trading fee percentage
  slippagePercent: number; // Expected slippage
  minProfitPercent: number; // Minimum profit after all costs
  maxPositionSize: number; // Max position for single trade
}

export interface ArbitrageStats {
  totalOpportunities: number;
  avgSpreadPercent: number;
  avgProfitPercent: number;
  highestSpreadPercent: number;
  byType: Record<string, { count: number; avgSpread: number }>;
}

export interface TriangularArbitrageOpportunity {
  id: string;
  path: string[]; // e.g., ["USD", "EUR", "GBP", "USD"]
  rates: number[];
  buyExchange: string;
  sellExchange: string;
  initialAmount: number;
  finalAmount: number;
  profitPercent: number;
  confidence: number;
}

export interface CorrelationPair {
  symbol1: string;
  symbol2: string;
  correlation: number;
  currentSpread: number;
  historicalSpreadMean: number;
  historicalSpreadStd: number;
  zScore: number;
  direction: "pairTrade" | "meanReversion" | "momentum";
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const ARBITRAGE_CONFIG: ArbitrageConfig = {
  minSpreadPercent: 0.1, // 0.1% minimum spread
  maxExecutionTime: 5000, // 5 seconds max
  feePercent: 0.1, // 0.1% per trade
  slippagePercent: 0.05, // 0.05% slippage
  minProfitPercent: 0.05, // 0.05% minimum profit
  maxPositionSize: 10000 // Max $10k position
};

// ============================================================================
// ARBITRAGE SERVICE
// ============================================================================

export class ArbitrageService {
  private static priceCache: Map<string, PriceData[]> = new Map();
  
  // ============================================================================
  // SPATIAL ARBITRAGE
  // ============================================================================
  
  /**
   * Find spatial arbitrage opportunities between exchanges
   */
  static findSpatialArbitrage(
    prices: Map<string, Map<string, PriceData>>
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Compare prices across exchanges
    prices.forEach((exchangePrices, symbol) => {
      const priceList = Array.from(exchangePrices.values());
      
      if (priceList.length < 2) return;
      
      // Find best bid and ask across exchanges
      let bestBid = { price: 0, exchange: "" };
      let bestAsk = { price: Infinity, exchange: "" };
      
      priceList.forEach(data => {
        if (data.bid > bestBid.price) {
          bestBid = { price: data.bid, exchange: data.exchange };
        }
        if (data.ask < bestAsk.price) {
          bestAsk = { price: data.ask, exchange: data.exchange };
        }
      });
      
      // Calculate spread
      const spread = bestBid.price - bestAsk.price;
      const spreadPercent = (spread / bestAsk.price) * 100;
      const profitPercent = spreadPercent - (ARBITRAGE_CONFIG.feePercent * 2) - ARBITRAGE_CONFIG.slippagePercent;
      
      // Only report if profitable after costs
      if (profitPercent >= ARBITRAGE_CONFIG.minProfitPercent) {
        opportunities.push({
          id: `spatial-${symbol}-${Date.now()}`,
          type: "spatial",
          symbol,
          exchanges: priceList.map(p => p.exchange),
          buyExchange: bestAsk.exchange,
          sellExchange: bestBid.exchange,
          buyPrice: bestAsk.price,
          sellPrice: bestBid.price,
          spread,
          spreadPercent: parseFloat(spreadPercent.toFixed(4)),
          profitPercent: parseFloat(profitPercent.toFixed(4)),
          confidence: Math.min(100, profitPercent * 10 + 50),
          timestamp: Date.now(),
          expiry: Date.now() + ARBITRAGE_CONFIG.maxExecutionTime,
          requiresExecution: true
        });
      }
    });
    
    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
  }
  
  // ============================================================================
  // TRIANGULAR ARBITRAGE
  // ============================================================================
  
  /**
   * Find triangular arbitrage opportunities in forex/crypto
   */
  static findTriangularArbitrage(
    rates: Map<string, number>,
    baseCurrency: string = "USD"
  ): TriangularArbitrageOpportunity[] {
    const opportunities: TriangularArbitrageOpportunity[] = [];
    
    // Common currency pairs for forex
    const currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];
    const pairs: [string, string][] = [];
    
    // Generate all possible pairs
    for (let i = 0; i < currencies.length; i++) {
      for (let j = 0; j < currencies.length; j++) {
        if (i !== j) {
          pairs.push([currencies[i], currencies[j]]);
        }
      }
    }
    
    // Check triangular combinations
    for (const [c1, c2] of pairs) {
      for (const [c2, c3] of pairs) {
        if (c2 === c3) continue;
        for (const [c3, c1Check] of pairs) {
          if (c3 === c1Check || c1Check !== c1) continue;
          
          // Check if we have rates for all three pairs
          const rate1 = rates.get(`${c1}/${c2}`);
          const rate2 = rates.get(`${c2}/${c3}`);
          const rate3 = rates.get(`${c3}/${c1}`);
          
          if (rate1 && rate2 && rate3) {
            // Calculate triangular arbitrage
            const initialAmount = 1;
            const step1 = initialAmount * rate1; // c1 -> c2
            const step2 = step1 * rate2; // c2 -> c3
            const step3 = step2 * rate3; // c3 -> c1
            const profitPercent = ((step3 - initialAmount) / initialAmount) * 100;
            
            if (profitPercent > ARBITRAGE_CONFIG.minProfitPercent) {
              opportunities.push({
                id: `triangular-${c1}-${c2}-${c3}-${Date.now()}`,
                path: [c1, c2, c3, c1],
                rates: [rate1, rate2, rate3],
                buyExchange: "Forex Market",
                sellExchange: "Forex Market",
                initialAmount,
                finalAmount: step3,
                profitPercent: parseFloat(profitPercent.toFixed(4)),
                confidence: Math.min(100, profitPercent * 5 + 30)
              });
            }
          }
        }
      }
    }
    
    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
  }
  
  // ============================================================================
  // STATISTICAL ARBITRAGE
  // ============================================================================
  
  /**
   * Find statistical arbitrage opportunities based on correlations
   */
  static findStatisticalArbitrage(
    prices: Map<string, OHLCV[]>,
    correlations: Map<string, number>
  ): CorrelationPair[] {
    const pairs: CorrelationPair[] = [];
    const symbols = Array.from(prices.keys());
    
    // Calculate correlation-based opportunities
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbol1 = symbols[i];
        const symbol2 = symbols[j];
        const key = `${symbol1}/${symbol2}`;
        const correlation = correlations.get(key) || 0;
        
        if (Math.abs(correlation) < 0.5) continue; // Skip weak correlations
        
        // Calculate spread statistics
        const prices1 = prices.get(symbol1)?.map(p => p.close) || [];
        const prices2 = prices.get(symbol2)?.map(p => p.close) || [];
        
        if (prices1.length < 20 || prices2.length < 20) continue;
        
        // Calculate ratio spread
        const spreads: number[] = [];
        const minLen = Math.min(prices1.length, prices2.length);
        for (let k = 0; k < minLen; k++) {
          if (prices2[k] !== 0) {
            spreads.push(prices1[k] / prices2[k]);
          }
        }
        
        if (spreads.length < 20) continue;
        
        // Calculate statistics
        const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
        const variance = spreads.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / spreads.length;
        const std = Math.sqrt(variance);
        
        const currentSpread = prices1[prices1.length - 1] / prices2[prices2.length - 1];
        const zScore = (currentSpread - mean) / (std || 1);
        
        // Determine direction
        let direction: "pairTrade" | "meanReversion" | "momentum" = "meanReversion";
        if (zScore > 2) {
          direction = "pairTrade"; // Short spread (short symbol1, long symbol2)
        } else if (zScore < -2) {
          direction = "pairTrade"; // Long spread (long symbol1, short symbol2)
        } else if (Math.abs(zScore) < 1) {
          direction = "momentum"; // Trade with momentum
        }
        
        pairs.push({
          symbol1,
          symbol2,
          correlation,
          currentSpread,
          historicalSpreadMean: mean,
          historicalSpreadStd: std,
          zScore: parseFloat(zScore.toFixed(2)),
          direction
        });
      }
    }
    
    return pairs.filter(p => Math.abs(p.zScore) > 1.5);
  }
  
  // ============================================================================
  // MERGER ARBITRAGE
  // ============================================================================
  
  /**
   * Analyze merger arbitrage opportunities
   */
  static analyzeMergerArbitrage(
    targetPrice: number,
    acquirerPrice: number,
    exchangeRatio: number,
    spreadPercent: number
  ): {
    opportunity: boolean;
    targetReturn: number;
    risk: "low" | "medium" | "high";
    reasoning: string;
  } {
    const expectedRatio = exchangeRatio;
    const actualRatio = acquirerPrice > 0 ? targetPrice / acquirerPrice : 0;
    const discrepancy = Math.abs(expectedRatio - actualRatio) / expectedRatio;
    
    // Calculate implied return
    const targetReturn = (expectedRatio - actualRatio) / actualRatio * 100;
    
    // Determine risk level
    let risk: "low" | "medium" | "high" = "medium";
    let reasoning = "";
    
    if (discrepancy < 0.02) {
      risk = "low";
      reasoning = "Small spread with high-probability merger completion";
    } else if (discrepancy > 0.1) {
      risk = "high";
      reasoning = "Large spread suggests significant deal risk";
    } else {
      reasoning = "Moderate spread with balanced risk/reward";
    }
    
    return {
      opportunity: risk !== "high" && Math.abs(targetReturn) > ARBITRAGE_CONFIG.minProfitPercent,
      targetReturn: parseFloat(targetReturn.toFixed(2)),
      risk,
      reasoning
    };
  }
  
  // ============================================================================
  // ARBITRAGE OPPORTUNITY ANALYSIS
  // ============================================================================
  
  /**
   * Get comprehensive arbitrage analysis for a symbol
   */
  static async getArbitrageAnalysis(
    symbol: string,
    prices: Map<string, PriceData>,
    historicalPrices?: Map<string, OHLCV[]>
  ): Promise<{
    spatial: ArbitrageOpportunity[];
    triangular: TriangularArbitrageOpportunity[];
    statistical: CorrelationPair[];
    summary: string;
  }> {
    // Convert prices to exchange map
    const exchangeMap = new Map<string, Map<string, PriceData>>();
    prices.forEach((data, key) => {
      if (!exchangeMap.has(data.exchange)) {
        exchangeMap.set(data.exchange, new Map());
      }
      exchangeMap.get(data.exchange)!.set(data.symbol, data);
    });
    
    // Find opportunities
    const spatial = this.findSpatialArbitrage(exchangeMap);
    
    // For triangular, we'd need forex rates
    const triangular: TriangularArbitrageOpportunity[] = [];
    
    // For statistical, we'd need correlation data
    const statistical: CorrelationPair[] = [];
    
    // Generate summary
    const summary = this.generateArbitrageSummary(symbol, spatial, triangular, statistical);
    
    return {
      spatial,
      triangular,
      statistical,
      summary
    };
  }
  
  /**
   * Generate arbitrage summary
   */
  static generateArbitrageSummary(
    symbol: string,
    spatial: ArbitrageOpportunity[],
    triangular: TriangularArbitrageOpportunity[],
    statistical: CorrelationPair[]
  ): string {
    const totalOpportunities = spatial.length + triangular.length + statistical.length;
    
    if (totalOpportunities === 0) {
      return `No significant arbitrage opportunities detected for ${symbol}. Markets appear efficient.`;
    }
    
    const avgSpread = spatial.length > 0
      ? spatial.reduce((sum, o) => sum + o.spreadPercent, 0) / spatial.length
      : 0;
    
    return `Found ${totalOpportunities} arbitrage opportunity(ies) for ${symbol}. ` +
      `Spatial: ${spatial.length} (avg ${avgSpread.toFixed(2)}% spread), ` +
      `Triangular: ${triangular.length}, ` +
      `Statistical: ${statistical.length}. ` +
      `Note: These opportunities are typically short-lived and require rapid execution.`;
  }
  
  // ============================================================================
  // CONVERSION TO TRADE SETUPS
  // ============================================================================
  
  /**
   * Convert arbitrage opportunities to trade setups
   */
  static convertToTradeSetups(
    opportunities: ArbitrageOpportunity[]
  ): TradeSetup[] {
    return opportunities
      .filter(op => op.profitPercent > ARBITRAGE_CONFIG.minProfitPercent)
      .map(op => ({
        id: op.id,
        symbol: op.symbol,
        direction: "Bullish" as const,
        entryPrice: op.buyPrice,
        stopLoss: op.sellPrice * 0.99, // 1% stop
        takeProfits: [op.sellPrice * (1 + op.profitPercent / 100)],
        riskReward: op.profitPercent / ARBITRAGE_CONFIG.slippagePercent,
        confidence: op.confidence,
        reasoning: `Arbitrage: Buy ${op.buyExchange} @ ${op.buyPrice.toFixed(4)}, Sell ${op.sellExchange} @ ${op.sellPrice.toFixed(4)}. Spread: ${op.spreadPercent.toFixed(2)}%`,
        killZone: "Arbitrage",
        timestamp: op.timestamp
      }));
  }
}

// ============================================================================
// ARBITRAGE HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate execution risk for an arbitrage opportunity
 */
export function calculateExecutionRisk(
  opportunity: ArbitrageOpportunity,
  historicalExecutionTime: number
): number {
  // Base risk increases with execution time
  const timeRisk = Math.min(100, (historicalExecutionTime / opportunity.expiry) * 100);
  
  // Confidence affects risk
  const confidenceRisk = (100 - opportunity.confidence) * 0.5;
  
  // Spread affects risk (smaller spreads = higher risk)
  const spreadRisk = Math.max(0, 20 - opportunity.spreadPercent * 10);
  
  return parseFloat(((timeRisk + confidenceRisk + spreadRisk) / 3).toFixed(2));
}

/**
 * Estimate maximum position size for an arbitrage opportunity
 */
export function estimateMaxPosition(
  opportunity: ArbitrageOpportunity,
  accountBalance: number
): number {
  // Risk-based sizing (never risk more than 1% of account)
  const maxRiskAmount = accountBalance * 0.01;
  const riskPerUnit = opportunity.sellPrice - opportunity.buyPrice;
  
  if (riskPerUnit <= 0) return 0;
  
  const sizeFromRisk = maxRiskAmount / riskPerUnit;
  
  // Cap at configured max
  return Math.min(sizeFromRisk, ARBITRAGE_CONFIG.maxPositionSize, accountBalance * 0.1);
}

/**
 * Check if arbitrage opportunity is still valid
 */
export function isArbitrageOpportunityValid(
  opportunity: ArbitrageOpportunity,
  currentPrices: Map<string, PriceData>
): boolean {
  if (Date.now() > opportunity.expiry) return false;
  
  const currentBuy = currentPrices.get(`${opportunity.symbol}-${opportunity.buyExchange}`);
  const currentSell = currentPrices.get(`${opportunity.symbol}-${opportunity.sellExchange}`);
  
  if (!currentBuy || !currentSell) return false;
  
  // Check if spread still exists
  const currentSpread = currentSell.bid - currentBuy.ask;
  return currentSpread > opportunity.spread * 0.5; // At least 50% of original spread
}
