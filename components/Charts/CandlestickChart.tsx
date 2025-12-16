
import React, { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, Time, CrosshairMode } from "lightweight-charts";
import { MarketDataService } from "../../services/marketData";
import { TechnicalIndicatorService } from "../../services/technicalIndicators";
import { wsService } from "../../services/websocketService";
import { Quote } from "../../types";

export interface IndicatorConfig {
  id: string;
  type: string;
  period?: number;
  color: string;
  lineWidth?: number;
  source?: "open" | "high" | "low" | "close";
  stdDev?: number;
  fastPeriod?: number;
  slowPeriod?: number;
  signalPeriod?: number;
}

interface ChartProps {
  symbol: string;
  height?: number;
  showVolume?: boolean;
  indicators?: IndicatorConfig[];
}

export function CandlestickChart({ symbol, height = 500, showVolume = true, indicators = [] }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Refs for data and series management
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, { series: ISeriesApi<any>; type: string; config: IndicatorConfig; upper?: ISeriesApi<any>; lower?: ISeriesApi<any>; middle?: ISeriesApi<any>; macd?: ISeriesApi<any>; signal?: ISeriesApi<any>; hist?: ISeriesApi<any> }>>(new Map());
  const priceDataRef = useRef<any[]>([]); // Store raw OHLCV for calculation

  // Helper to extract source array based on config
  const getSourceData = (data: any[], source: string = 'close') => {
      return data.map(d => d[source] || d.close);
  };

  // Helper to calculate and update specific indicator
  const updateIndicatorSeries = (config: IndicatorConfig, seriesObj: any, allData: any[], updateType: 'setData' | 'update' = 'setData') => {
      // Ensure integer timestamps to avoid floating point mismatch errors
      const timestamps = allData.map(d => Math.floor(d.timestamp / 1000) as Time);
      const sourceData = getSourceData(allData, config.source);
      
      // Calculation Logic
      let values: any[] = [];
      let resultObj: any = {};

      if (config.type === "SMA") values = TechnicalIndicatorService.calculateSMA(sourceData, config.period || 14);
      else if (config.type === "EMA") values = TechnicalIndicatorService.calculateEMA(sourceData, config.period || 14);
      else if (config.type === "RSI") values = calculateRSIArray(sourceData, config.period || 14);
      else if (config.type === "BB") resultObj = TechnicalIndicatorService.calculateBollingerBands(sourceData, config.period || 20, config.stdDev || 2);
      else if (config.type === "MACD") resultObj = TechnicalIndicatorService.calculateMACD(sourceData, config.fastPeriod || 12, config.slowPeriod || 26, config.signalPeriod || 9);

      // Alignment Helper: Align results to the end of the timestamp array
      // This ignores timestamps returned by the service (which are often newly generated) and uses chart data timestamps
      const alignData = (results: any[]) => {
          const startIdx = timestamps.length - results.length;
          return results.map((val, i) => ({
              time: timestamps[startIdx + i],
              val
          })).filter(d => d.time !== undefined);
      };

      // Apply Data
      if (updateType === 'setData') {
           if (["SMA", "EMA"].includes(config.type)) {
               const aligned = alignData(values);
               seriesObj.series.setData(aligned.map((d) => ({ time: d.time, value: d.val.value })));
           } else if (config.type === "RSI") {
               // RSI array length is padded to match input, so direct mapping works
               seriesObj.series.setData(values.map((v, i) => ({ time: timestamps[i], value: v })));
           } else if (config.type === "BB") {
               const aligned = alignData(resultObj);
               if (seriesObj.upper) seriesObj.upper.setData(aligned.map((d: any) => ({ time: d.time, value: d.val.upper })));
               if (seriesObj.lower) seriesObj.lower.setData(aligned.map((d: any) => ({ time: d.time, value: d.val.lower })));
               if (seriesObj.middle) seriesObj.middle.setData(aligned.map((d: any) => ({ time: d.time, value: d.val.middle })));
           } else if (config.type === "MACD") {
               const aligned = alignData(resultObj);
               if (seriesObj.macd) seriesObj.macd.setData(aligned.map((d: any) => ({ time: d.time, value: d.val.macd })));
               if (seriesObj.signal) seriesObj.signal.setData(aligned.map((d: any) => ({ time: d.time, value: d.val.signal })));
               if (seriesObj.hist) seriesObj.hist.setData(aligned.map((d: any) => ({ time: d.time, value: d.val.histogram, color: d.val.histogram >= 0 ? '#10b981' : '#ef4444' })));
           }
      } else {
          // Real-time Update: Update the last point
          const lastTime = timestamps[timestamps.length - 1];
          
          if (["SMA", "EMA"].includes(config.type)) {
              const last = values[values.length - 1];
              if(last) seriesObj.series.update({ time: lastTime, value: last.value });
          } else if (config.type === "RSI") {
              const last = values[values.length - 1];
              if(last !== undefined) seriesObj.series.update({ time: lastTime, value: last });
          } else if (config.type === "BB") {
              const last = resultObj[resultObj.length - 1];
              if (last) {
                  if (seriesObj.upper) seriesObj.upper.update({ time: lastTime, value: last.upper });
                  if (seriesObj.lower) seriesObj.lower.update({ time: lastTime, value: last.lower });
                  if (seriesObj.middle) seriesObj.middle.update({ time: lastTime, value: last.middle });
              }
          } else if (config.type === "MACD") {
              const last = resultObj[resultObj.length - 1];
              if (last) {
                  if (seriesObj.macd) seriesObj.macd.update({ time: lastTime, value: last.macd });
                  if (seriesObj.signal) seriesObj.signal.update({ time: lastTime, value: last.signal });
                  if (seriesObj.hist) seriesObj.hist.update({ time: lastTime, value: last.histogram, color: last.histogram >= 0 ? '#10b981' : '#ef4444' });
              }
          }
      }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 1. Determine Layout ---
    const oscillators = indicators.filter(i => ["RSI", "MACD"].includes(i.type));
    const hasOscillator = oscillators.length > 0;
    const priceScaleMargins = hasOscillator ? { top: 0.05, bottom: 0.30 } : { top: 0.05, bottom: 0.05 };
    const oscillatorScaleMargins = { top: 0.75, bottom: 0 };

    // --- 2. Initialize Chart ---
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9CA3AF' },
      grid: { vertLines: { color: '#374151', visible: false }, horzLines: { color: '#374151', visible: false } },
      width: containerRef.current.clientWidth,
      height: height,
      timeScale: { timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
    });
    chartRef.current = chart;

    // --- 3. Add Main Series ---
    const candleSeries = chart.addCandlestickSeries({ 
      upColor: '#10b981', downColor: '#ef4444', 
      borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#ef4444',
      priceScaleId: 'right'
    });
    candleSeriesRef.current = candleSeries;
    chart.priceScale('right').applyOptions({ scaleMargins: priceScaleMargins });

    // Add Volume Series
    if (showVolume) {
        chart.priceScale('volume-scale').applyOptions({
            scaleMargins: { top: hasOscillator ? 0.55 : 0.8, bottom: hasOscillator ? 0.30 : 0.0 },
        });
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume-scale',
        });
        volumeSeriesRef.current = volumeSeries;
    }

    // --- 4. Load Initial Data ---
    const rawData = MarketDataService.generateHistoricalData(symbol, 500);
    priceDataRef.current = rawData; // Sync Ref
    
    // Ensure using integer timestamps
    candleSeries.setData(rawData.map(d => ({
      time: Math.floor(d.timestamp / 1000) as Time,
      open: d.open, high: d.high, low: d.low, close: d.close
    })));

    if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(rawData.map(d => ({
            time: Math.floor(d.timestamp / 1000) as Time,
            value: d.volume,
            color: d.close >= d.open ? '#10b98180' : '#ef444480'
        })));
    }

    // --- 5. Add Indicators & Store Refs ---
    indicatorSeriesRef.current.clear(); // Clear old refs
    indicators.forEach(ind => {
      // Overlays
      if (["SMA", "EMA", "BB"].includes(ind.type)) {
         if (ind.type === "BB") {
            const upper = chart.addLineSeries({ color: ind.color, lineWidth: 1, priceScaleId: 'right', title: `BB Up` });
            const lower = chart.addLineSeries({ color: ind.color, lineWidth: 1, priceScaleId: 'right', title: `BB Low` });
            const middle = chart.addLineSeries({ color: ind.color, lineWidth: 1, lineStyle: 2, priceScaleId: 'right', title: `BB Basis` });
            
            indicatorSeriesRef.current.set(ind.id, { series: middle, upper, lower, middle, type: 'BB', config: ind } as any);
         } else {
            const line = chart.addLineSeries({ color: ind.color, lineWidth: (ind.lineWidth || 2) as any, priceScaleId: 'right', title: `${ind.type} ${ind.period}` });
            indicatorSeriesRef.current.set(ind.id, { series: line, type: ind.type, config: ind });
         }
      }
      // Oscillators
      else if (["RSI", "MACD"].includes(ind.type)) {
          const scaleId = `indicator-${ind.id}`;
          chart.priceScale(scaleId).applyOptions({ scaleMargins: oscillatorScaleMargins });
          
          if (ind.type === "RSI") {
             const line = chart.addLineSeries({ color: ind.color, lineWidth: 2, priceScaleId: scaleId, title: `RSI ${ind.period}` });
             
             // Static lines
             const top = chart.addLineSeries({ color: '#ef4444', lineWidth: 1, lineStyle: 2, priceScaleId: scaleId, priceLineVisible: false });
             const bot = chart.addLineSeries({ color: '#10b981', lineWidth: 1, lineStyle: 2, priceScaleId: scaleId, priceLineVisible: false });
             const timestamps = rawData.map(d => Math.floor(d.timestamp / 1000) as Time);
             top.setData(timestamps.map(t => ({ time: t, value: 70 })));
             bot.setData(timestamps.map(t => ({ time: t, value: 30 })));
             
             indicatorSeriesRef.current.set(ind.id, { series: line, type: 'RSI', config: ind });
          } else if (ind.type === "MACD") {
             const macdLine = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, priceScaleId: scaleId, title: 'MACD' });
             const signalLine = chart.addLineSeries({ color: '#f97316', lineWidth: 2, priceScaleId: scaleId, title: 'Signal' });
             const histogram = chart.addHistogramSeries({ color: ind.color, priceScaleId: scaleId, title: 'Hist' });
             
             indicatorSeriesRef.current.set(ind.id, { series: macdLine, macd: macdLine, signal: signalLine, hist: histogram, type: 'MACD', config: ind } as any);
          }
      }
      
      // Calculate initial data for this indicator
      const stored = indicatorSeriesRef.current.get(ind.id);
      if (stored) updateIndicatorSeries(ind, stored, rawData, 'setData');
    });

    chart.timeScale().fitContent();

    // --- 6. Tooltip with Indicators ---
    chart.subscribeCrosshairMove(param => {
        if (!tooltipRef.current) return;
        if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > containerRef.current!.clientWidth || param.point.y < 0 || param.point.y > containerRef.current!.clientHeight) {
            tooltipRef.current.style.display = 'none';
        } else {
            const dateStr = new Date((param.time as number) * 1000).toLocaleDateString();
            const data = param.seriesData.get(candleSeries) as any;
            
            if (data) {
                tooltipRef.current.style.display = 'block';
                tooltipRef.current.style.left = param.point.x + 'px';
                tooltipRef.current.style.top = param.point.y + 'px';
                
                let tooltipContent = `
                    <div class="font-bold mb-1">${dateStr}</div>
                    <div class="grid grid-cols-2 gap-x-4 gap-y-1 mb-2 border-b border-border/50 pb-2">
                        <span>O:</span><span class="font-mono text-right">${data.open?.toFixed(2)}</span>
                        <span>H:</span><span class="font-mono text-right">${data.high?.toFixed(2)}</span>
                        <span>L:</span><span class="font-mono text-right">${data.low?.toFixed(2)}</span>
                        <span>C:</span><span class="font-mono text-right ${data.close >= data.open ? 'text-green-500' : 'text-red-500'}">${data.close?.toFixed(2)}</span>
                    </div>
                `;

                // Add Indicators to Tooltip
                indicatorSeriesRef.current.forEach((ind) => {
                    if (ind.type === 'BB') {
                        const m = ind.middle ? param.seriesData.get(ind.middle) as any : null;
                        if (m) {
                             tooltipContent += `<div class="mt-1 pt-1 text-[10px] text-muted-foreground flex justify-between items-center">
                                <span style="color: ${ind.config.color}">BB(${ind.config.period})</span>
                                <span class="font-mono">${m.value.toFixed(2)}</span>
                            </div>`;
                        }
                    } else if (ind.type === 'MACD') {
                        const m = ind.macd ? param.seriesData.get(ind.macd) as any : null;
                        const s = ind.signal ? param.seriesData.get(ind.signal) as any : null;
                        if (m && s) {
                             tooltipContent += `<div class="mt-1 pt-1 text-[10px] text-muted-foreground">
                                <div class="flex justify-between"><span class="text-blue-500">MACD</span><span class="font-mono">${m.value.toFixed(2)}</span></div>
                                <div class="flex justify-between"><span class="text-orange-500">Sig</span><span class="font-mono">${s.value.toFixed(2)}</span></div>
                            </div>`;
                        }
                    } else {
                        // Simple Line Series (SMA, EMA, RSI)
                        const val = param.seriesData.get(ind.series) as any;
                        if (val) {
                             tooltipContent += `<div class="mt-1 pt-1 text-[10px] text-muted-foreground flex justify-between items-center">
                                <span style="color: ${ind.config.color}">${ind.type} ${ind.config.period}</span>
                                <span class="font-mono">${val.value.toFixed(2)}</span>
                            </div>`;
                        }
                    }
                });

                tooltipRef.current.innerHTML = tooltipContent;
            }
        }
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => { 
        window.removeEventListener('resize', handleResize);
        chart.remove(); 
        chartRef.current = null;
    };
  }, [symbol, height, showVolume, indicators]); // Full re-init on config change

  // --- 7. Real-Time Data Updates ---
  useEffect(() => {
    const handleQuote = (quote: Quote) => {
        if (!candleSeriesRef.current) return;

        const currentData = priceDataRef.current;
        const lastCandle = currentData[currentData.length - 1];
        
        // Simple 1-minute candle simulation logic
        const updatedCandle = {
            ...lastCandle,
            close: quote.price,
            high: Math.max(lastCandle.high, quote.price),
            low: Math.min(lastCandle.low, quote.price),
            volume: lastCandle.volume + (Math.random() * 1000)
        };

        // Update Ref Data
        currentData[currentData.length - 1] = updatedCandle;
        
        // Update Chart with Integer Timestamp
        const time = Math.floor(updatedCandle.timestamp / 1000) as Time;
        
        candleSeriesRef.current.update({
            time: time,
            open: updatedCandle.open,
            high: updatedCandle.high,
            low: updatedCandle.low,
            close: updatedCandle.close
        });

        if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
                time: time,
                value: updatedCandle.volume,
                color: updatedCandle.close >= updatedCandle.open ? '#10b98180' : '#ef444480'
            });
        }

        // Update Indicators Real-time
        indicatorSeriesRef.current.forEach((val) => {
            updateIndicatorSeries(val.config, val, currentData, 'update');
        });
    };

    wsService.subscribe(`quote:${symbol}`, handleQuote);
    return () => wsService.unsubscribe(`quote:${symbol}`, handleQuote);
  }, [symbol]); 

  return (
    <div className="relative w-full group">
        <div ref={containerRef} className="w-full" />
        <div 
            ref={tooltipRef} 
            className="absolute hidden pointer-events-none bg-background/95 border border-border p-3 rounded shadow-xl text-xs z-20 backdrop-blur-md min-w-[140px]"
            style={{ transform: 'translate(10px, 10px)' }}
        />
    </div>
  );
}

// Helper to calculate RSI array for charting
function calculateRSIArray(prices: number[], period: number = 14): number[] {
    const rsiArray: number[] = [];
    if (prices.length < period + 1) return prices.map(() => 50); // Fallback

    const changes = [];
    for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);

    let avgGain = 0, avgLoss = 0;
    
    // First RSI
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) avgGain += changes[i];
        else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period;
    avgLoss /= period;
    
    // Fill initial undefined periods with 50
    for(let i=0; i<period; i++) rsiArray.push(50);
    
    // Calculate rest
    for (let i = period; i < changes.length; i++) {
        const gain = changes[i] > 0 ? changes[i] : 0;
        const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
        
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiArray.push(100 - 100 / (1 + rs));
    }
    // Pad end to match price length
    rsiArray.push(rsiArray[rsiArray.length-1]); 
    
    return rsiArray;
}
