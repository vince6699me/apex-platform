import { RiskMetrics, PositionSizing, RiskAlert } from "../types";

export class RiskManagementService {
  static calculateRiskMetrics(portfolioValues: number[], marketValues: number[]): RiskMetrics {
    // Simplified Mock calculation
    return {
      valueAtRisk95: 5000,
      valueAtRisk99: 7500,
      conditionalVaR: 8000,
      sharpeRatio: 1.8,
      sortinoRatio: 2.1,
      maxDrawdown: 12000,
      maxDrawdownPercent: 12,
      calmarRatio: 1.5,
      beta: 1.1,
      alpha: 2.5,
      volatility: 15,
    };
  }

  static calculatePositionSize(params: Omit<PositionSizing, "shares" | "positionSize" | "riskAmount">): PositionSizing {
    const { method, accountSize, riskPercent, stopLoss, entryPrice } = params;
    const riskAmount = accountSize * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    let shares = Math.floor(riskAmount / (riskPerShare || 1));
    if (method === "volatility") shares = Math.floor(shares * 0.8); // Mock adjustment
    return { ...params, shares, positionSize: shares * entryPrice, riskAmount };
  }

  static generateRiskAlerts(metrics: RiskMetrics, portfolioValue: number): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    if (metrics.maxDrawdownPercent > 10) {
      alerts.push({ level: "high", message: "High Drawdown", metric: "Max DD", value: metrics.maxDrawdownPercent, threshold: 10, timestamp: Date.now() });
    }
    return alerts;
  }

  static assessRiskLevel(metrics: RiskMetrics): "Low" | "Medium" | "High" | "Extreme" {
    if (metrics.maxDrawdownPercent < 10) return "Low";
    if (metrics.maxDrawdownPercent < 20) return "Medium";
    return "High";
  }
}