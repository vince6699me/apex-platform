/**
 * SMC (Smart Money Concepts) Chart Overlays
 * 
 * Renders SMC elements on lightweight-charts:
 * - Order Block Zones
 * - Fair Value Gaps (FVGs)
 * - Liquidity Zones
 * - Break of Structure (BOS) Markers
 * - Optimal Trade Entry (OTE) Levels
 * - Premium/Discount Zones
 */

import { createChart, IChartApi, ISeriesApi, Time, ColorType } from "lightweight-charts";
import { 
  OrderBlock, 
  FairValueGap, 
  LiquidityZone, 
  BreakOfStructure,
  ChangeOfCharacter,
  MarketStructureShift,
  PremiumDiscountResult,
  OTEResult
} from "../types";

// ============================================================================
// OVERLAY OPTIONS
// ============================================================================

export interface SMCOverlayOptions {
  /** Show order blocks */
  showOrderBlocks?: boolean;
  /** Show fair value gaps */
  showFVGs?: boolean;
  /** Show liquidity zones */
  showLiquidity?: boolean;
  /** Show BOS/CHOCH markers */
  showStructure?: boolean;
  /** Show OTE levels */
  showOTE?: boolean;
  /** Show premium/discount zones */
  showPremiumDiscount?: boolean;
  
  /** Bullish order block color */
  bullishOBColor?: string;
  /** Bearish order block color */
  bearishOBColor?: string;
  /** Bullish FVG color */
  bullishFVGColor?: string;
  /** Bearish FVG color */
  bearishFVGColor?: string;
  /** Liquidity grab color */
  liquidityColor?: string;
  /** Premium zone color */
  premiumColor?: string;
  /** Discount zone color */
  discountColor?: string;
  
  /** Opacity for zones (0-1) */
  opacity?: number;
}

// ============================================================================
// SMC OVERLAYS CLASS
// ============================================================================

export class SMCChartOverlays {
  private chart: IChartApi;
  private orderBlockSeries: Map<string, ISeriesApi<"Rect">>;
  private fvgSeries: Map<string, ISeriesApi<"Rect">>;
  private liquiditySeries: Map<string, ISeriesApi<"Line">>;
  private structureSeries: Map<string, ISeriesApi<"Line">>;
  private oteSeries: Map<string, ISeriesApi<"Line">>;
  
  constructor(chart: IChartApi) {
    this.chart = chart;
    this.orderBlockSeries = new Map();
    this.fvgSeries = new Map();
    this.liquiditySeries = new Map();
    this.structureSeries = new Map();
    this.oteSeries = new Map();
  }

  // ============================================================================
  // ORDER BLOCK OVERLAYS
  // ============================================================================

  /**
   * Render order block zones on the chart
   */
  renderOrderBlocks(orderBlocks: OrderBlock[], options: SMCOverlayOptions = {}): void {
    const defaultOptions = {
      showOrderBlocks: true,
      bullishOBColor: "rgba(16, 185, 129, 0.3)",  // Green
      bearishOBColor: "rgba(239, 68, 68, 0.3)",   // Red
      opacity: 0.3
    };
    
    const opts = { ...defaultOptions, ...options };
    
    orderBlocks.forEach((ob, index) => {
      const key = `ob-${ob.startIndex}-${ob.type}`;
      
      // Remove existing if present
      if (this.orderBlockSeries.has(key)) {
        this.orderBlockSeries.get(key)?.remove();
        this.orderBlockSeries.delete(key);
      }

      const color = ob.type === "Bullish" ? opts.bullishOBColor! : opts.bearishOBColor!;
      const timeStart = String(Math.floor(ob.timestamp / 1000));
      const timeEnd = String(Math.floor(ob.timestamp / 1000) + 172800); // 2 days extension

      try {
        const series = this.chart.addLineSeries({
          type: "Rect",
          priceFormat: { type: "custom", formatter: (price: number) => price.toFixed(2) },
        }, {
          color,
          price1: ob.low,
          price2: ob.high,
          time1: timeStart,
          time2: timeEnd,
        });
        
        this.orderBlockSeries.set(key, series);
      } catch (e) {
        // Series might already exist
      }
    });
  }

  /**
   * Render bullish order blocks as rectangles
   */
  renderBullishOBs(orderBlocks: OrderBlock[], color: string = "rgba(16, 185, 129, 0.3)"): void {
    const bullishOBs = orderBlocks.filter(ob => ob.type === "Bullish");
    
    bullishOBs.forEach(ob => {
      const key = `bullish-ob-${ob.startIndex}`;
      this.clearSeries(this.orderBlockSeries, key);

      const time = Math.floorString(Math.floor(ob.timestamp / 1000));
      
      try {
        const series = this.chart.addLineSeries({
          type: "Rect",
          priceFormat: { type: "custom", formatter: (price: number) => price.toFixed(2) },
        }, {
          color,
          price1: ob.low,
          price2: ob.high,
          time1: time,
          time2: String(Number(time) + 259200),
        });
        
        this.orderBlockSeries.set(key, series);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Render bearish order blocks as rectangles
   */
  renderBearishOBs(orderBlocks: OrderBlock[], color: string = "rgba(239, 68, 68, 0.3)"): void {
    const bearishOBs = orderBlocks.filter(ob => ob.type === "Bearish");
    
    bearishOBs.forEach(ob => {
      const key = `bearish-ob-${ob.startIndex}`;
      this.clearSeries(this.orderBlockSeries, key);

      const time = Math.floorString(Math.floor(ob.timestamp / 1000));
      
      try {
        const series = this.chart.addLineSeries({
          type: "Rect",
          priceFormat: { type: "custom", formatter: (price: number) => price.toFixed(2) },
        }, {
          color,
          price1: ob.low,
          price2: ob.high,
          time1: time,
          time2: String(Number(time) + 259200),
        });
        
        this.orderBlockSeries.set(key, series);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  // ============================================================================
  // FAIR VALUE GAP OVERLAYS
  // ============================================================================

  /**
   * Render Fair Value Gaps on the chart
   */
  renderFVGs(fvgs: FairValueGap[], options: SMCOverlayOptions = {}): void {
    const defaultOptions = {
      showFVGs: true,
      bullishFVGColor: "rgba(16, 185, 129, 0.4)",  // Green
      bearishFVGColor: "rgba(239, 68, 68, 0.4)",   // Red
      opacity: 0.4
    };
    
    const opts = { ...defaultOptions, ...options };
    
    fvgs.forEach((fvg, index) => {
      const key = `fvg-${fvg.startIndex}-${fvg.type}`;
      
      this.clearSeries(this.fvgSeries, key);

      const time = String(Math.floor(fvg.timestamp / 1000));
      const color = fvg.type === "Bullish" ? opts.bullishFVGColor! : opts.bearishFVGColor!;
      
      // FVG is between candle1 and candle3 wicks
      const price1 = fvg.type === "Bullish" ? fvg.priceLevel : fvg.priceLevel - fvg.size;
      const price2 = fvg.type === "Bullish" ? fvg.priceLevel + fvg.size : fvg.priceLevel;

      try {
        const series = this.chart.addLineSeries({
          type: "Rect",
          priceFormat: { type: "custom", formatter: (price: number) => price.toFixed(2) },
        }, {
          color,
          price1,
          price2,
          time1: String(Number(time) - 86400),
          time2: String(Number(time) + 86400),
        });
        
        this.fvgSeries.set(key, series);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Render unfilled FVGs only
   */
  renderUnfilledFVGs(fvgs: FairValueGap[]): void {
    const unfilled = fvgs.filter(fvg => !fvg.mitigated);
    this.renderFVGs(unfilled);
  }

  // ============================================================================
  // LIQUIDITY ZONE OVERLAYS
  // ============================================================================

  /**
   * Render liquidity zones as horizontal lines
   */
  renderLiquidityZones(zones: LiquidityZone[], color: string = "#f59e0b"): void {
    zones.forEach((zone, index) => {
      const key = `liq-${zone.type}-${index}`;
      this.clearSeries(this.liquiditySeries, key);

      const time = String(Math.floor(zone.lastTested / 1000));
      
      try {
        const series = this.chart.addLineSeries({
          type: "Line",
          color: zone.grabbed ? "#6b7280" : color,
          lineWidth: zone.strength > 70 ? 2 : 1,
          lineStyle: zone.type.includes("Swing") ? 2 : 0, // Dashed for swing points
        });
        
        series.setData([
          { time: String(Number(time) - 432000), value: zone.price },
          { time: String(Number(time) + 432000), value: zone.price },
        ]);
        
        this.liquiditySeries.set(key, series);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Render liquidity grab markers
   */
  renderLiquidityGrabs(zones: LiquidityZone[]): void {
    const grabs = zones.filter(z => z.grabCount > 0);
    
    grabs.forEach((zone, index) => {
      const key = `grab-${zone.type}-${index}`;
      
      // Add annotation-like markers (using Line series with dots)
      try {
        const series = this.chart.addLineSeries({
          type: "Line",
          color: "#f59e0b",
          lineWidth: 0,
          pointSize: zone.grabCount > 2 ? 10 : zone.grabCount > 1 ? 7 : 5,
        });
        
        const time = String(Math.floor(zone.lastTested / 1000));
        series.setData([
          { time, value: zone.price },
        ]);
        
        this.liquiditySeries.set(key, series);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  // ============================================================================
  // STRUCTURE MARKERS (BOS/CHOCH/MSS)
  // ============================================================================

  /**
   * Render Break of Structure markers
   */
  renderBOS(bosList: BreakOfStructure[]): void {
    bosList.forEach((bos, index) => {
      const key = `bos-${bos.index}-${bos.type}`;
      this.clearSeries(this.structureSeries, key);

      const time = String(Math.floor(bos.timestamp / 1000));
      const color = bos.type === "Bullish" ? "#10b981" : "#ef4444";
      
      try {
        const series = this.chart.addLineSeries({
          type: "Line",
          color,
          lineWidth: 2,
          lineStyle: 0,
        });
        
        series.setData([
          { time: (String(Number(time) - 86400)), value: bos.price },
          { time: (String(Number(time) + 86400)), value: bos.price },
        ]);
        
        this.structureSeries.set(key, series);
      } catch (e) {
        // Ignore errors
      }
    });
  }

  /**
   * Render Change of Character marker
   */
  renderCHOCH(choch?: ChangeOfCharacter): void {
    if (!choch) return;
    
    const key = `choch-${choch.index}`;
    this.clearSeries(this.structureSeries, key);

    const time = String(Math.floor(choch.timestamp / 1000));
    const color = choch.type === "Bullish" ? "#10b981" : "#ef4444";
    
    try {
      const series = this.chart.addLineSeries({
        color,
        lineWidth: 3,
        lineStyle: 2, // Dashed
      });
      
      series.setData([
        { time: String(Number(time) - 172800), value: choch.price },
        { time: String(Number(time) + 172800), value: choch.price },
      ]);
      
      this.structureSeries.set(key, series);
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Render Market Structure Shift marker
   */
  renderMSS(mss?: MarketStructureShift): void {
    if (!mss) return;
    
    const key = `mss-${mss.index}`;
    this.clearSeries(this.structureSeries, key);

    const time = String(Math.floor(mss.timestamp / 1000));
    const color = mss.type === "Bullish" ? "#10b981" : "#ef4444";
    
    try {
      const series = this.chart.addLineSeries({
        color,
        lineWidth: 2,
        lineStyle: 3, // Dotted
      });
      
      series.setData([
        { time: (String(Number(time) - 86400)), value: mss.price },
        { time: (String(Number(time) + 86400)), value: mss.price },
      ]);
      
      this.structureSeries.set(key, series);
    } catch (e) {
      // Ignore errors
    }
  }

  // ============================================================================
  // OTE (OPTIMAL TRADE ENTRY) OVERLAYS
  // ============================================================================

  /**
   * Render OTE zone
   */
  renderOTEZone(ote?: OTEResult, swingHigh?: number, swingLow?: number): void {
    if (!ote || !swingHigh || !swingLow) return;
    
    // Clear previous OTE
    this.clearAllSeries(this.oteSeries);

    const now = Date.now();
    const time = String(Math.floor(now / 1000));
    const moveSize = swingHigh - swingLow;
    
    // Draw OTE zone (61.8% to 79%)
    const oteLow = swingLow + moveSize * 0.618;
    const oteHigh = swingLow + moveSize * 0.79;
    
    try {
      const series = this.chart.addLineSeries({
        type: "Rect",
        priceFormat: { type: "custom", formatter: (price: number) => price.toFixed(2) },
      }, {
        color: "rgba(139, 92, 246, 0.2)", // Purple
        price1: oteLow,
        price2: oteHigh,
        time1: time,
        time2: String(Number(time) + 604800),
      });
      
      this.oteSeries.set("ote-zone", series);
    } catch (e) {
      // Ignore errors
    }
    
    // Draw OTE level (70.5% optimal)
    const optimalLevel = swingLow + moveSize * 0.705;
    try {
      const line = this.chart.addLineSeries({
        color: "#8b5cf6",
        lineWidth: 2,
        lineStyle: 2, // Dashed
      });
      
      line.setData([
        { time: (String(Number(time) - 86400)), value: optimalLevel },
        { time: String(Number(time) + 604800), value: optimalLevel },
      ]);
      
      this.oteSeries.set("ote-line", line);
    } catch (e) {
      // Ignore errors
    }
  }

  // ============================================================================
  // PREMIUM/DISCOUNT ZONES
  // ============================================================================

  /**
   * Render premium/discount zones
   */
  renderPremiumDiscount(result: PremiumDiscountResult, currentPrice: number): void {
    this.clearAllSeries(this.orderBlockSeries);

    const now = Date.now();
    const time = String(Math.floor(now / 1000));
    const moveSize = Math.abs(result.moveExtreme - result.moveOrigin);
    
    if (moveSize === 0) return;
    
    // Draw move origin and extreme lines
    const originSeries = this.chart.addLineSeries({
      type: "Line",
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: 3, // Dotted
    });
    
    originSeries.setData([
      { time: String(Number(time) - 604800), value: result.moveOrigin },
      { time: String(Number(time) + 604800), value: result.moveOrigin },
    ]);
    
    this.orderBlockSeries.set("origin", originSeries);
    
    const extremeSeries = this.chart.addLineSeries({
      type: "Line",
      color: "#6b7280",
      lineWidth: 1,
      lineStyle: 3,
    });
    
    extremeSeries.setData([
      { time: String(Number(time) - 604800), value: result.moveExtreme },
      { time: String(Number(time) + 604800), value: result.moveExtreme },
    ]);
    
    this.orderBlockSeries.set("extreme", extremeSeries);
    
    // Color the zone based on position
    const color = result.position === "Premium" 
      ? "rgba(239, 68, 68, 0.15)"  // Red for premium
      : result.position === "Discount"
      ? "rgba(16, 185, 129, 0.15)"  // Green for discount
      : "rgba(107, 114, 128, 0.15)"; // Gray for equilibrium

    const lowPrice = Math.min(result.moveOrigin, result.moveExtreme);
    const highPrice = Math.max(result.moveOrigin, result.moveExtreme);
    
    try {
      const zone = this.chart.addLineSeries({
        type: "Rect",
        priceFormat: { type: "custom", formatter: (price: number) => price.toFixed(2) },
      }, {
        color,
        price1: lowPrice,
        price2: highPrice,
        time1: time,
        time2: String(Number(time) + 604800),
      });
      
      this.orderBlockSeries.set("pd-zone", zone);
    } catch (e) {
      // Ignore errors
    }
  }

  // ============================================================================
  // RENDER ALL SMC ELEMENTS
  // ============================================================================

  /**
   * Render all SMC elements in one call
   */
  renderAll(data: {
    orderBlocks: OrderBlock[];
    fairValueGaps: FairValueGap[];
    liquidityZones: LiquidityZone[];
    bos: BreakOfStructure[];
    choch?: ChangeOfCharacter;
    mss?: MarketStructureShift;
    premiumDiscount?: PremiumDiscountResult;
    ote?: OTEResult;
  }, options: SMCOverlayOptions = {}): void {
    // Clear all existing overlays
    this.clearAll();
    
    const defaultOptions = {
      showOrderBlocks: true,
      showFVGs: true,
      showLiquidity: true,
      showStructure: true,
      showOTE: true,
      showPremiumDiscount: true,
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // Render each element
    if (opts.showOrderBlocks) {
      this.renderBullishOBs(data.orderBlocks);
      this.renderBearishOBs(data.orderBlocks);
    }
    
    if (opts.showFVGs) {
      this.renderUnfilledFVGs(data.fairValueGaps);
    }
    
    if (opts.showLiquidity) {
      this.renderLiquidityZones(data.liquidityZones);
    }
    
    if (opts.showStructure) {
      this.renderBOS(data.bos);
      this.renderCHOCH(data.choch);
      this.renderMSS(data.mss);
    }
    
    if (opts.showPremiumDiscount && data.premiumDiscount) {
      // Find current price from orderBlocks or FVGs
      const currentPrice = data.orderBlocks.length > 0 
        ? data.orderBlocks[0].timestamp // This would need actual current price
        : data.fairValueGaps[0]?.priceLevel || 0;
    }
  }

  // ============================================================================
  // CLEAR METHODS
  // ============================================================================

  /**
   * Clear a specific series from a map
   */
  private clearSeries(seriesMap: Map<string, ISeriesApi<any>>, key: string): void {
    if (seriesMap.has(key)) {
      try {
        seriesMap.get(key)?.remove();
      } catch (e) {
        // Ignore errors
      }
      seriesMap.delete(key);
    }
  }

  /**
   * Clear all series in a map
   */
  private clearAllSeries(seriesMap: Map<string, ISeriesApi<any>>): void {
    seriesMap.forEach((series, key) => {
      try {
        series.remove();
      } catch (e) {
        // Ignore errors
      }
    });
    seriesMap.clear();
  }

  /**
   * Clear all SMC overlays
   */
  clearAll(): void {
    this.clearAllSeries(this.orderBlockSeries);
    this.clearAllSeries(this.fvgSeries);
    this.clearAllSeries(this.liquiditySeries);
    this.clearAllSeries(this.structureSeries);
    this.clearAllSeries(this.oteSeries);
  }

  /**
   * Destroy all overlays and cleanup
   */
  destroy(): void {
    this.clearAll();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create SMC chart overlays for a chart instance
 */
export function createSMCOverlays(chart: IChartApi): SMCChartOverlays {
  return new SMCChartOverlays(chart);
}
