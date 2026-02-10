/**
 * Trading Intelligence Page - Production Edition
 * 
 * Advanced trading lab with:
 * - Real SMC Analysis integration
 * - Trade setup generation
 * - Backtesting engine
 * - Kill zone timing
 * - Chart pattern recognition
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Progress, Textarea } from "../components/ui/primitives";
import {
  Play, Activity, Gauge, Sparkles, TrendingUp, TrendingDown,
  Brain, Target, Clock, BarChart3, RefreshCw, DollarSign,
  ArrowUpRight, ArrowDownRight, Zap, Settings, Save
} from "lucide-react";
import { AIIntelligenceService } from "../services/aiIntelligence";
import { SMCBacktestEngine } from "../services/smcBacktest";
import { MarketDataService } from "../services/marketData";
import { getActiveKillZone } from "../services/killZoneService";
import { BacktestConfig, SMCAnalysis, TradeSetup, KillZone } from "../types";

// Fallback data when APIs fail
const getFallbackQuote = (symbol: string) => ({
  symbol,
  price: 150 + Math.random() * 100,
  change: Math.random() * 10 - 5,
  changePercent: Math.random() * 10 - 5,
  volume: "10M",
  high: 160,
  low: 140,
  open: 155,
  previousClose: 152,
  timestamp: Date.now()
});

// ============================================================================
// COMPONENT: Signal Confluence
// ============================================================================

interface SignalConfluenceProps {
  symbol: string;
}

function SignalConfluence({ symbol }: SignalConfluenceProps) {
  const [analysis, setAnalysis] = useState<{
    smc: SMCAnalysis;
    setups: TradeSetup[];
    quote: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await AIIntelligenceService.analyzeWithSMC(symbol);
      const quote = await MarketDataService.getQuoteFromAlphaVantage(symbol);
      setAnalysis({
        smc: result.smcAnalysis,
        setups: result.tradeSetups,
        quote,
      });
    } catch (err) {
      console.error("Failed to fetch analysis:", err);
      setError("Using demo data - API unavailable");
      setAnalysis({
        smc: {
          orderBlocks: [],
          fairValueGaps: [],
          liquidityZones: [],
          bos: [],
          currentBias: "Neutral",
          trendStrength: 50,
          premiumDiscount: { position: "Equilibrium", percentage: 50, range: { high: 0, low: 0 } }
        },
        setups: [],
        quote: getFallbackQuote(symbol)
      });
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center">
          {error && (
            <div className="mb-4 p-2 bg-yellow-500/10 text-yellow-500 rounded text-sm">
              {error}
            </div>
          )}
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          Enter a symbol to load analysis
        </CardContent>
      </Card>
    );
  }

  const { smc, setups, quote } = analysis;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            Signal Confluence
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price & ATR */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-card/50">
          <div>
            <div className="text-sm text-muted-foreground">Current Price</div>
            <div className="text-3xl font-bold">${quote.price.toFixed(2)}</div>
            <div className={`text-sm ${quote.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
              {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}% (24h)
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Market Bias</div>
            <div className={`text-2xl font-bold ${smc.currentBias === "Bullish" ? "text-green-500" :
                smc.currentBias === "Bearish" ? "text-red-500" : "text-muted-foreground"
              }`}>
              {smc.currentBias}
            </div>
            <Badge variant="outline">{smc.trendStrength}% strength</Badge>
          </div>
        </div>

        {/* Consensus Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Confluence Score</span>
            <span className="font-bold">{Math.min(smc.trendStrength + setups.length * 5, 100)}%</span>
          </div>
          <Progress value={Math.min(smc.trendStrength + setups.length * 5, 100)} className="h-2" />
        </div>

        {/* Analysis Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Premium/Discount */}
          <div className="p-4 rounded-lg bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Position</span>
              <Badge className={
                smc.premiumDiscount.position === "Discount" ? "bg-green-500/20 text-green-500" :
                  smc.premiumDiscount.position === "Premium" ? "bg-red-500/20 text-red-500" :
                    "bg-muted text-muted-foreground"
              }>
                {smc.premiumDiscount.position}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {smc.premiumDiscount.percentage}% through range
            </div>
          </div>

          {/* Structure */}
          <div className="p-4 rounded-lg bg-card/50">
            <div className="text-sm text-muted-foreground mb-1">Market Structure</div>
            <div className="font-bold">{smc.bos.length} BOS signals</div>
            <div className="text-xs text-muted-foreground">
              {smc.choch ? "CHOCH detected" : "No CHOCH"}
            </div>
          </div>
        </div>

        {/* Active Trade Setups */}
        {setups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Active Setups ({setups.length})</span>
            </div>
            <div className="space-y-2">
              {setups.slice(0, 4).map((setup) => (
                <div key={setup.id} className={`p-3 rounded-lg border ${setup.direction === "Bullish"
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {setup.direction === "Bullish" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{setup.direction} {setup.setup}</div>
                        <div className="text-xs text-muted-foreground">
                          {setup.setup} | {setup.confidence}% confidence
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">${setup.entryPrice.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        SL: ${setup.stopLoss.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={setup.confidence} className="h-1 flex-1" />
                    <Badge variant="outline" className="text-xs">
                      1:{setup.riskReward} R:R
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SMC Elements Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{smc.orderBlocks.length}</div>
            <div className="text-xs text-muted-foreground">OBs</div>
          </div>
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{smc.fairValueGaps.filter(f => !f.mitigated).length}</div>
            <div className="text-xs text-muted-foreground">FVGs</div>
          </div>
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{smc.liquidityZones.length}</div>
            <div className="text-xs text-muted-foreground">Liquidity</div>
          </div>
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{smc.bos.length}</div>
            <div className="text-xs text-muted-foreground">BOS</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: SMC Backtester
// ============================================================================

interface BacktesterProps {
  symbol: string;
}

function SMCBacktester({ symbol }: BacktesterProps) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Partial<BacktestConfig>>({
    initialCapital: 10000,
    riskPercent: 0.02,
    enableOB: true,
    enableFVG: true,
    enableCHOCH: true,
    enablePD: true,
    trendFilter: true,
  });

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await MarketDataService.getHistoryFromPolygon(symbol);
      if (history.length > 0) {
        const engine = new SMCBacktestEngine(history, {
          initialCapital: config.initialCapital || 10000,
          riskPercent: config.riskPercent || 0.02,
          positionSize: 0.02,
          maxPositions: 3,
          spread: 0.0001,
          commission: 0,
          slMultiplier: 1.5,
          tpMultiplier: 2.0,
          enableOB: config.enableOB ?? true,
          enableFVG: config.enableFVG ?? true,
          enableCHOCH: config.enableCHOCH ?? true,
          enablePD: config.enablePD ?? true,
          trendFilter: config.trendFilter ?? true,
        });
        const report = engine.run();
        setResult(report);
      } else {
        setError("No historical data available");
      }
    } catch (err) {
      console.error("Backtest failed:", err);
      setError("Backtest failed - try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          SMC Strategy Backtest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Config */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Initial Capital</label>
            <Input
              type="number"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) })}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Risk %</label>
            <Input
              type="number"
              step="0.01"
              value={config.riskPercent}
              onChange={(e) => setConfig({ ...config, riskPercent: parseFloat(e.target.value) })}
              className="font-mono"
            />
          </div>
        </div>

        {/* Strategy Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 p-2 rounded bg-card/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableOB}
              onChange={(e) => setConfig({ ...config, enableOB: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Order Blocks</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded bg-card/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableFVG}
              onChange={(e) => setConfig({ ...config, enableFVG: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Fair Value Gaps</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded bg-card/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableCHOCH}
              onChange={(e) => setConfig({ ...config, enableCHOCH: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">CHOCH Signals</span>
          </label>
          <label className="flex items-center gap-2 p-2 rounded bg-card/50 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enablePD}
              onChange={(e) => setConfig({ ...config, enablePD: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Premium/Discount</span>
          </label>
        </div>

        <Button onClick={runBacktest} disabled={loading} className="w-full">
          {loading ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Run Backtest</>
          )}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {/* P&L */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-card/50">
              <div>
                <div className="text-sm text-muted-foreground">Net P&L</div>
                <div className={`text-3xl font-bold ${result.result.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                  ${result.result.totalPnL.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.result.totalPnLPercent.toFixed(1)}% return
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Profit Factor</div>
                <div className={`text-2xl font-bold ${result.result.profitFactor >= 1.5 ? "text-green-500" : result.result.profitFactor >= 1 ? "text-yellow-500" : "text-red-500"}`}>
                  {result.result.profitFactor.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded bg-card/50 text-center">
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-xl font-bold">{result.result.winRate.toFixed(1)}%</div>
              </div>
              <div className="p-3 rounded bg-card/50 text-center">
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
                <div className="text-xl font-bold text-red-500">{result.result.maxDrawdown.toFixed(2)}%</div>
              </div>
              <div className="p-3 rounded bg-card/50 text-center">
                <div className="text-sm text-muted-foreground">Sharpe</div>
                <div className="text-xl font-bold">{result.result.sharpeRatio.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded bg-card/50 text-center">
                <div className="text-sm text-muted-foreground">Wins</div>
                <div className="text-xl font-bold text-green-500">{result.result.wins}</div>
              </div>
              <div className="p-3 rounded bg-card/50 text-center">
                <div className="text-sm text-muted-foreground">Losses</div>
                <div className="text-xl font-bold text-red-500">{result.result.losses}</div>
              </div>
              <div className="p-3 rounded bg-card/50 text-center">
                <div className="text-sm text-muted-foreground">Trades</div>
                <div className="text-xl font-bold">{result.result.totalTrades}</div>
              </div>
            </div>

            {/* Setup Performance */}
            {Object.keys(result.setupStats).length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Performance by Setup</div>
                <div className="space-y-2">
                  {Object.entries(result.setupStats)
                    .sort((a, b) => ((b[1] as any).trades) - ((a[1] as any).trades))
                    .slice(0, 5)
                    .map(([setup, data]: [string, any]) => {
                      const dataAny = data as any;
                      const total = dataAny.wins + dataAny.losses;
                      const wr = total > 0 ? (dataAny.wins / total) * 100 : 0;
                      return (
                        <div key={setup} className="flex items-center justify-between p-2 rounded bg-card/50">
                          <span className="text-sm">{setup}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{total} trades</span>
                            <Badge variant="outline" className={`${wr >= 50 ? "text-green-500" : "text-red-500"}`}>
                              {wr.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Kill Zone Dashboard
// ============================================================================

function KillZoneDashboard() {
  const [activeZone, setActiveZone] = useState<any>(null);
  const [nextZone, setNextZone] = useState<any>(null);

  useEffect(() => {
    const updateZones = () => {
      // Use the service function for accurate kill zone data
      const killZoneData = getActiveKillZone();
      setActiveZone(killZoneData.zone);
      // Calculate next zone manually if needed
      const now = new Date();
      const estHour = (now.getUTCHours() - 5 + 24) % 24;
      const zones = [
        { name: "Asian Kill Zone", startHour: 20, endHour: 24, pairs: ["AUD/JPY", "NZD/JPY", "USD/JPY"] },
        { name: "London Kill Zone", startHour: 2, endHour: 5, pairs: ["EUR/USD", "GBP/USD", "EUR/JPY"] },
        { name: "London Open", startHour: 5, endHour: 7, pairs: ["EUR/USD", "GBP/USD", "USD/JPY"] },
        { name: "New York Kill Zone", startHour: 7, endHour: 9, pairs: ["EUR/USD", "GBP/USD", "USD/JPY"] },
        { name: "London Close", startHour: 10, endHour: 12, pairs: ["EUR/USD", "GBP/USD"] }
      ];

      if (!killZoneData.zone) {
        for (const z of zones) {
          if (estHour < z.startHour) {
            setNextZone(z);
            break;
          }
        }
      }
    };

    updateZones();
    const interval = setInterval(updateZones, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Kill Zone Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Zone */}
        <div className={`p-4 rounded-lg ${activeZone ? "bg-green-500/10 border border-green-500/30" : "bg-card/50"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${activeZone ? "bg-green-500/20" : "bg-muted"}`}>
                <Clock className={`h-4 w-4 ${activeZone ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="font-medium">{activeZone?.name || "Off Hours"}</div>
                <div className="text-xs text-muted-foreground">
                  {activeZone ? "Trading active" : "Waiting for session"}
                </div>
              </div>
            </div>
            {activeZone && (
              <Badge className="bg-green-500/20 text-green-500">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
          {activeZone?.pairs && (
            <div className="flex flex-wrap gap-1 mt-2">
              {activeZone.pairs.map((pair: string) => (
                <Badge key={pair} variant="outline" className="text-xs">
                  {pair}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Next Zone */}
        {nextZone && !activeZone && (
          <div className="p-4 rounded-lg bg-card/50">
            <div className="text-sm text-muted-foreground mb-1">Next Kill Zone</div>
            <div className="font-medium">{nextZone.name}</div>
            <div className="text-xs text-muted-foreground">
              {nextZone.pairs?.slice(0, 3).join(", ")}
            </div>
          </div>
        )}

        {/* Session Schedule */}
        <div className="space-y-1">
          <div className="text-sm font-medium mb-2">Session Schedule (EST)</div>
          {[
            { name: "Asian", time: "8PM - 12AM", pairs: "AUD, NZD, JPY" },
            { name: "London", time: "2AM - 5AM", pairs: "EUR, GBP" },
            { name: "NY Open", time: "7AM - 9AM", pairs: "USD pairs" },
            { name: "London Close", time: "10AM - 12PM", pairs: "All Majors" }
          ].map((session) => (
            <div key={session.name} className="flex items-center justify-between text-sm p-2 rounded bg-card/50">
              <span>{session.name}</span>
              <span className="text-muted-foreground">{session.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function TradingIntelligencePage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [activeTab, setActiveTab] = useState("confluence");

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trading Intelligence Lab</h1>
          <p className="text-muted-foreground mt-1">
            SMC analysis, backtesting, and trade setup generation
          </p>
        </div>
      </div>

      {/* Symbol Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="w-32 font-bold font-mono"
            placeholder="Symbol"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="confluence">Confluence</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="killzone">Kill Zones</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "confluence" && <SignalConfluence symbol={symbol} />}
          {activeTab === "backtest" && <SMCBacktester symbol={symbol} />}
          {activeTab === "killzone" && (
            <div className="space-y-6">
              <KillZoneDashboard />
              <SignalConfluence symbol={symbol} />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <KillZoneDashboard />

          {/* Quick Stats */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-card/50 text-center">
                  <div className="text-sm text-muted-foreground">Order Blocks</div>
                  <div className="text-xl font-bold">Auto-detected</div>
                </div>
                <div className="p-3 rounded bg-card/50 text-center">
                  <div className="text-sm text-muted-foreground">FVGs</div>
                  <div className="text-xl font-bold">Real-time</div>
                </div>
                <div className="p-3 rounded bg-card/50 text-center">
                  <div className="text-sm text-muted-foreground">Liquidity</div>
                  <div className="text-xl font-bold">Sweeps</div>
                </div>
                <div className="p-3 rounded bg-card/50 text-center">
                  <div className="text-sm text-muted-foreground">Structure</div>
                  <div className="text-xl font-bold">BOS/CHOCH</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMC Features Info */}
          <Card className="border-border/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                SMC Features
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Order Block detection & quality scoring</li>
                <li>• Fair Value Gap identification</li>
                <li>• Liquidity zone mapping</li>
                <li>• Market Structure (BOS/CHOCH/MSS)</li>
                <li>• Premium/Discount positioning</li>
                <li>• Optimal Trade Entry (OTE)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
