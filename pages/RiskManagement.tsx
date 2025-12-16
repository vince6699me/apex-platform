import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/primitives";
import { RiskManagementService } from "../services/riskManagement";

export default function RiskManagement() {
  const metrics = RiskManagementService.calculateRiskMetrics([], []);
  
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Risk Management</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>VaR (95%)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">${metrics.valueAtRisk95}</div><div className="text-sm text-muted-foreground">Daily</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Sharpe Ratio</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{metrics.sharpeRatio}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Max Drawdown</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-500">{metrics.maxDrawdownPercent}%</div></CardContent>
        </Card>
      </div>
    </div>
  );
}