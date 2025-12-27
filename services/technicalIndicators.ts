import { OHLCV } from "../types";
import { IndicatorValue, MACDResult, BollingerBandsResult } from "../types";

export class TechnicalIndicatorService {
  static calculateSMA(data: number[], period: number): IndicatorValue[] {
    const results: IndicatorValue[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      results.push({
        timestamp: Date.now() - (data.length - i - 1) * 86400000,
        value: sum / period,
      });
    }
    return results;
  }

  static calculateEMA(data: number[], period: number): IndicatorValue[] {
    const k = 2 / (period + 1);
    const results: IndicatorValue[] = [];
    let ema = data[0];
    results.push({ timestamp: Date.now() - (data.length - 1) * 86400000, value: ema });

    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
      results.push({ timestamp: Date.now() - (data.length - i - 1) * 86400000, value: ema });
    }
    return results;
  }

  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    const changes = [];
    for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);

    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i]; else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period; avgLoss /= period;

    for (let i = period; i < changes.length; i++) {
      const gain = changes[i] > 0 ? changes[i] : 0;
      const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult[] {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine: number[] = [];
    const minLength = Math.min(fastEMA.length, slowEMA.length);
    for (let i = 0; i < minLength; i++) macdLine.push(fastEMA[i].value - slowEMA[i].value);
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const results: MACDResult[] = [];
    for (let i = 0; i < signalLine.length; i++) {
      results.push({
        timestamp: signalLine[i].timestamp,
        macd: macdLine[i + macdLine.length - signalLine.length],
        signal: signalLine[i].value,
        histogram: macdLine[i + macdLine.length - signalLine.length] - signalLine[i].value,
      });
    }
    return results;
  }

  static calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): BollingerBandsResult[] {
    const sma = this.calculateSMA(prices, period);
    const results: BollingerBandsResult[] = [];
    for (let i = 0; i < sma.length; i++) {
      const slice = prices.slice(i, i + period);
      const mean = sma[i].value;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const sd = Math.sqrt(variance);
      results.push({
        timestamp: sma[i].timestamp,
        upper: mean + stdDev * sd,
        middle: mean,
        lower: mean - stdDev * sd,
      });
    }
    return results;
  }

  static calculateATR(ohlcv: OHLCV[], period: number = 14): number {
    if (ohlcv.length < period + 1) return 0;
    const trueRanges: number[] = [];
    for (let i = 1; i < ohlcv.length; i++) {
      const high = ohlcv[i].high;
      const low = ohlcv[i].low;
      const prevClose = ohlcv[i - 1].close;
      trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    }
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < trueRanges.length; i++) atr = (atr * (period - 1) + trueRanges[i]) / period;
    return atr;
  }

  static calculateVWAP(ohlcv: OHLCV[]): number {
    let cumVolumePrice = 0, cumVolume = 0;
    for (const candle of ohlcv) {
      const tp = (candle.high + candle.low + candle.close) / 3;
      cumVolumePrice += tp * candle.volume;
      cumVolume += candle.volume;
    }
    return cumVolume > 0 ? cumVolumePrice / cumVolume : 0;
  }

  static calculateMFI(ohlcv: OHLCV[], period: number = 14): number {
    if (ohlcv.length < period + 1) return 50;
    const moneyFlow: { positive: number; negative: number }[] = [];
    for (let i = 1; i < ohlcv.length; i++) {
      const tp = (ohlcv[i].high + ohlcv[i].low + ohlcv[i].close) / 3;
      const ptp = (ohlcv[i - 1].high + ohlcv[i - 1].low + ohlcv[i - 1].close) / 3;
      const rmf = tp * ohlcv[i].volume;
      if (tp > ptp) moneyFlow.push({ positive: rmf, negative: 0 });
      else moneyFlow.push({ positive: 0, negative: rmf });
    }
    const recent = moneyFlow.slice(-period);
    const pos = recent.reduce((sum, mf) => sum + mf.positive, 0);
    const neg = recent.reduce((sum, mf) => sum + mf.negative, 0);
    if (neg === 0) return 100;
    return 100 - 100 / (1 + pos / neg);
  }
}