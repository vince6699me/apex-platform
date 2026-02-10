/**
 * SMC Backtester Panel
 * 
 * UI for backtesting SMC strategies against historical data:
 * - Configure backtest parameters
 * - Run strategy backtests
 * - View results and performance metrics
 * - Compare different strategies
 * - Analyze equity curves and trade distributions
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "../../components/ui/primitives";
import { 
  Play, 
  RotateCcw, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  BarChart3,
  Calendar,
  Settings,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { 
  OHLCV, 
  BacktestConfig, 
  BacktestResult, 
  BacktestReport 
} from "../../types";
import { 
  SMCBacktestEngine, 
  runQuickBacktest, 
  conservativeOBStrategy,
  aggressiveFVGStrategy,
  balancedStrategy 
} from "../../services/smcBacktest";
import { MarketDataService } from "../../services/marketData";

// ============================================================================
// CONFIGURATION PANEL
// ============================================================================

interface BacktestConfigPanelProps {
  config: Partial<BacktestConfig>;
  onConfigChange: (config: Partial<BacktestConfig>) => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
}

function ConfigPanel({ config, onConfigChange, onRun, onReset, isRunning }: BacktestConfigPanelProps) {
  const presets = [
    { name: "Conservative OB", config: conservativeOBStrategy, description: "High quality OBs only, 1:2 R:R" },
    { name: "Balanced", config: balancedStrategy, description: "OB + FVG + PD, 1:2 R:R" },
    { name: "Aggressive FVG", config: aggressiveFVGStrategy, description: "FVG + CHOCH, 1:3 R:R" },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          Backtest Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">STRATEGY PRESETS</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onConfigChange(preset.config)}
                className={`p-2 rounded-lg text-left text-xs border transition-colors ${
                  JSON.stringify(config).includes(preset.name) 
                    ? "bg-primary/20 border-primary/50" 
                    : "bg-card/50 border-border/50 hover:bg-card"
                }`}
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-muted-foreground text-[10px]">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Key Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Initial Capital</label>
            <input
              type="number"
              value={config.initialCapital || 10000}
              onChange={(e) => onConfigChange({ initialCapital: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Risk per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={config.riskPercent || 1}
              onChange={(e) => onConfigChange({ riskPercent: parseFloat(e.target.value) / 100 })}
              className="w-full mt-1 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max Positions</label>
            <input
              type="number"
              value={config.maxPositions || 3}
              onChange={(e) => onConfigChange({ maxPositions: parseInt(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Spread (pips)</label>
            <input
              type="number"
              step="0.1"
              value={config.spread || 1}
              onChange={(e) => onConfigChange({ spread: parseFloat(e.target.value) / 10000 })}
              className="w-full mt-1 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Strategy Toggles */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">ENABLED STRATEGIES</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableOB || false}
                onChange={(e) => onConfigChange({ enableOB: e.target.checked })}
                className="rounded"
              />
              <span>Order Blocks</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableFVG || false}
                onChange={(e) => onConfigChange({ enableFVG: e.target.checked })}
                className="rounded"
              />
              <span>Fair Value Gaps</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableCHOCH || false}
                onChange={(e) => onConfigChange({ enableCHOCH: e.target.checked })}
                className="rounded"
              />
              <span>CHOCH Signals</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.enablePD || false}
                onChange={(e) => onConfigChange({ enablePD: e.target.checked })}
                className="rounded"
              />
              <span>Premium/Discount</span>
            </label>
          </div>
        </div>

        {/* Risk/Reward */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Stop Loss Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={config.slMultiplier || 1.5}
              onChange={(e) => onConfigChange({ slMultiplier: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Take Profit (R:R)</label>
            <input
              type="number"
              step="0.1"
              value={config.tpMultiplier || 2}
              onChange={(e) => onConfigChange({ tpMultiplier: parseFloat(e.target.value) })}
              className="w-full mt-1 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Trend Filter */}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={config.trendFilter || false}
            onChange={(e) => onConfigChange({ trendFilter: e.target.checked })}
            className="rounded"
          />
          <span>Filter by Trend Direction</span>
        </label>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={onRun} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Backtest
          </Button>
          <Button 
            variant="outline" 
            onClick={onReset}
            disabled={isRunning}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RESULTS PANEL
// ============================================================================

interface ResultsPanelProps {
  result: BacktestResult | null;
  report: BacktestReport | null;
}

function ResultsPanel({ result, report }: ResultsPanelProps) {
  if (!result) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Backtest Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Configure and run a backtest to see results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = result.totalPnL > 0;
  const isWinRateGood = result.winRate >= 50;
  const isPFGood = result.profitFactor >= 1.5;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Backtest Results
          </CardTitle>
          <Badge className={isProfitable ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
            {isProfitable ? "PROFITABLE" : "UNPROFITABLE"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">Net P&L</div>
            <div className={`text-xl font-bold ${isProfitable ? "text-green-400" : "text-red-400"}`}>
              ${result.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {result.totalPnLPercent.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className={`text-xl font-bold ${isWinRateGood ? "text-green-400" : "text-yellow-400"}`}>
              {result.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {result.wins}W / {result.losses}L
            </div>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-center">
            <div className="text-xs text-muted-foreground">Profit Factor</div>
            <div className={`text-xl font-bold ${isPFGood ? "text-green-400" : "text-yellow-400"}`}>
              {result.profitFactor.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {result.totalTrades} trades
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="text-red-400">{result.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span>{result.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sortino Ratio</span>
              <span>{result.sortinoRatio.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Win</span>
              <span className="text-green-400">${result.averageWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Loss</span>
              <span className="text-red-400">${result.averageLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best/Worst</span>
              <span>
                <span className="text-green-400">{result.bestTrade.toFixed(1)}%</span>
                {" / "}
                <span className="text-red-400">{result.worstTrade.toFixed(1)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Streaks */}
        <div className="flex gap-4">
          <div className="flex-1 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Max Win Streak</span>
            </div>
            <div className="text-lg font-bold">{result.consecutiveWins}</div>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Max Loss Streak</span>
            </div>
            <div className="text-lg font-bold">{result.consecutiveLosses}</div>
          </div>
        </div>

        {/* Setup Performance */}
        {report && Object.keys(report.setupStats).length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">SETUP PERFORMANCE</div>
            <div className="space-y-2">
              {Object.entries(report.setupStats)
                .sort((a, b) => (b[1].trades) - (a[1].trades))
                .slice(0, 5)
                .map(([setup, stats]) => {
                  const wr = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
                  return (
                    <div key={setup} className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                      <span className="text-sm">{setup}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{stats.trades} trades</span>
                        <Badge variant="outline" className={`text-xs ${wr >= 50 ? "text-green-400" : "text-red-400"}`}>
                          {wr.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Export */}
        {report && (
          <Button variant="outline" className="w-full" onClick={() => {
            const csv = report.trades.map(t => 
              `${t.id},${t.symbol},${t.direction},${t.entryPrice},${t.exitPrice},${t.pnl.toFixed(2)},${t.setup}`
            ).join("\n");
            const blob = new Blob([`TradeID,Symbol,Direction,Entry,Exit,PnL,Setup\n${csv}`], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "backtest_results.csv";
            a.click();
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TRADES LIST
// ============================================================================

interface TradesListProps {
  trades: any[];
}

function TradesList({ trades }: TradesListProps) {
  if (!trades || trades.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Trade History ({trades.length} trades)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {trades.slice(0, 50).map((trade, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                trade.pnl > 0 
                  ? "bg-green-500/5 border-green-500/20" 
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${
                  trade.direction === "long" ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  {trade.direction === "long" 
                    ? <TrendingUp className="h-3 w-3 text-green-400" />
                    : <TrendingDown className="h-3 w-3 text-red-400" />
                  }
                </div>
                <div>
                  <div className="text-sm font-medium">{trade.setup}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(trade.entryTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${trade.pnl > 0 ? "text-green-400" : "text-red-400"}`}>
                  ${trade.pnl.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {trade.pnlPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN BACKTESTER COMPONENT
// ============================================================================

interface BacktesterPanelProps {
  symbol?: string;
  defaultDays?: number;
}

export function BacktesterPanel({ symbol = "AAPL", defaultDays = 365 }: BacktesterPanelProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OHLCV[]>([]);
  const [report, setReport] = useState<BacktestReport | null>(null);
  const [config, setConfig] = useState<Partial<BacktestConfig>>({
    initialCapital: 10000,
    riskPercent: 0.02,
    positionSize: 0.02,
    maxPositions: 3,
    spread: 0.0001,
    commission: 0,
    slMultiplier: 1.5,
    tpMultiplier: 2.0,
    enableOB: true,
    enableFVG: true,
    enableCHOCH: false,
    enablePD: true,
    trendFilter: true,
  });

  // Fetch historical data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const history = await MarketDataService.getHistoryFromPolygon(symbol);
      setData(history.slice(-defaultDays)); // Use last N days
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [symbol, defaultDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run backtest
  const runBacktest = useCallback(() => {
    if (data.length === 0) return;

    setLoading(true);
    try {
      // Add required config fields
      const fullConfig: BacktestConfig = {
        initialCapital: config.initialCapital || 10000,
        riskPercent: config.riskPercent || 0.02,
        positionSize: config.positionSize || 0.02,
        maxPositions: config.maxPositions || 3,
        spread: config.spread || 0.0001,
        commission: config.commission || 0,
        slMultiplier: config.slMultiplier || 1.5,
        tpMultiplier: config.tpMultiplier || 2.0,
        enableOB: config.enableOB ?? true,
        enableFVG: config.enableFVG ?? true,
        enableCHOCH: config.enableCHOCH ?? false,
        enablePD: config.enablePD ?? true,
        trendFilter: config.trendFilter ?? true,
      };

      const engine = new SMCBacktestEngine(data, fullConfig);
      const result = engine.run();
      setReport(result);
    } catch (error) {
      console.error("Backtest failed:", error);
    } finally {
      setLoading(false);
    }
  }, [data, config]);

  // Reset
  const reset = useCallback(() => {
    setReport(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            SMC Strategy Backtester
          </h2>
          <p className="text-sm text-muted-foreground">
            Test SMC strategies against {data.length} bars of {symbol} data
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          {loading ? "Loading..." : `${data.length} bars`}
        </Badge>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ConfigPanel 
            config={config}
            onConfigChange={setConfig}
            onRun={runBacktest}
            onReset={reset}
            isRunning={loading}
          />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <ResultsPanel 
            result={report?.result || null}
            report={report || null}
          />
          
          {report && (
            <TradesList trades={report.trades} />
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <div className="font-medium">Backtesting Disclaimer</div>
            <div className="text-sm text-muted-foreground mt-1">
              Past performance does not guarantee future results. Backtests may suffer from lookahead bias, 
              survivorship bias, and unrealistic slippage assumptions. Always forward test strategies before 
              live trading.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BacktesterPanel;
