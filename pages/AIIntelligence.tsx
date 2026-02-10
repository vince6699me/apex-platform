/**
 * AI Intelligence Page - Production Edition
 * 
 * Real-time AI-powered trading intelligence:
 * - SMC Analysis (Order Blocks, FVGs, Market Structure)
 * - Trade Setups with real-time signals
 * - Kill Zone timing
 * - Pattern Recognition (Silver Bullet, Judas Swing)
 * - Performance metrics from Trade Logger
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Progress } from "../components/ui/primitives";
import {
  Brain, Sparkles, TrendingUp, TrendingDown, Zap, Target,
  Activity, RefreshCw, BarChart3, Clock, Shield, AlertTriangle,
  ArrowUpRight, ArrowDownRight, DollarSign, History, Search, Play
} from "lucide-react";
import { AIIntelligenceService } from "../services/aiIntelligence";
import { TradeLoggerService } from "../services/tradeLogger";
import { SMCBacktestEngine } from "../services/smcBacktest";
import { MarketDataService } from "../services/marketData";
import { getActiveKillZone } from "../services/killZoneService";
import {
  SMCAnalysis,
  TradeSetup,
  KillZone,
  SmartMoneyPattern
} from "../types";

// Fallback data when APIs fail
const getFallbackAnalysis = (symbol: string) => ({
  smc: {
    orderBlocks: [],
    fairValueGaps: [],
    liquidityZones: [],
    bos: [],
    currentBias: "Neutral" as const,
    trendStrength: 50,
    premiumDiscount: { position: "Equilibrium" as const, percentage: 50, range: { high: 0, low: 0 } }
  },
  setups: [],
  killZone: null
});

// ============================================================================
// COMPONENT: Kill Zone Display
// ============================================================================

function KillZoneDisplay() {
  const [killZone, setKillZone] = useState<{ zone: KillZone | null; timeRemaining: string; isActive: boolean }>({
    zone: null,
    timeRemaining: "",
    isActive: false
  });

  useEffect(() => {
    const updateKillZone = () => {
      const now = new Date();
      const estHour = (now.getUTCHours() - 5 + 24) % 24; // EST

      // Use the service function for accurate kill zone data
      const killZoneData = getActiveKillZone();
      setKillZone({
        zone: killZoneData.zone,
        timeRemaining: killZoneData.timeRemaining > 0 ? `${killZoneData.timeRemaining} min` : "",
        isActive: killZoneData.isActive
      });
    };

    updateKillZone();
    const interval = setInterval(updateKillZone, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={`border-border/50 ${killZone.isActive ? "bg-green-500/5" : "bg-card/40"}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${killZone.isActive ? "bg-green-500/20" : "bg-muted"}`}>
              <Clock className={`h-5 w-5 ${killZone.isActive ? "text-green-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="font-medium">
                {killZone.isActive ? killZone.zone?.name : "Off Hours"}
              </div>
              <div className="text-sm text-muted-foreground">
                {killZone.isActive ? `${killZone.timeRemaining} remaining` : `Starts in ${killZone.timeRemaining}`}
              </div>
            </div>
          </div>
          {killZone.isActive && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: SMC Analysis Card
// ============================================================================

function SMCAnalysisCard({ symbol }: { symbol: string }) {
  const [analysis, setAnalysis] = useState<{
    smc: SMCAnalysis;
    setups: TradeSetup[];
    killZone: KillZone | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await AIIntelligenceService.analyzeWithSMC(symbol);
      setAnalysis({
        smc: result.smcAnalysis,
        setups: result.tradeSetups,
        killZone: result.killZone,
      });
    } catch (err) {
      console.error("SMC analysis failed:", err);
      setError("Using demo data - API unavailable");
      setAnalysis(getFallbackAnalysis(symbol));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 text-center">
          {error && (
            <div className="mb-2 p-2 bg-yellow-500/10 text-yellow-500 rounded text-sm">
              {error}
            </div>
          )}
          <Button onClick={fetchAnalysis} className="mt-2">
            <Brain className="h-4 w-4 mr-2" />
            Load SMC Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            SMC Analysis - {symbol}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchAnalysis}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Bias */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
          <div>
            <div className="text-sm text-muted-foreground">Market Bias</div>
            <div className={`text-xl font-bold ${analysis.smc.currentBias === "Bullish" ? "text-green-500" :
                analysis.smc.currentBias === "Bearish" ? "text-red-500" : "text-muted-foreground"
              }`}>
              {analysis.smc.currentBias}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Strength</div>
            <div className="text-xl font-bold">{analysis.smc.trendStrength}%</div>
          </div>
        </div>

        {/* Premium/Discount */}
        <div className="p-3 rounded-lg bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Position</span>
            <Badge className={
              analysis.smc.premiumDiscount.position === "Discount" ? "bg-green-500/20 text-green-500" :
                analysis.smc.premiumDiscount.position === "Premium" ? "bg-red-500/20 text-red-500" :
                  "bg-muted text-muted-foreground"
            }>
              {analysis.smc.premiumDiscount.position} Zone
            </Badge>
          </div>
          <Progress value={analysis.smc.premiumDiscount.percentage} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {analysis.smc.premiumDiscount.percentage}% through recent range
          </div>
        </div>

        {/* SMC Elements Count */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{analysis.smc.orderBlocks.length}</div>
            <div className="text-xs text-muted-foreground">Order Blocks</div>
          </div>
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{analysis.smc.fairValueGaps.filter(f => !f.mitigated).length}</div>
            <div className="text-xs text-muted-foreground">FVGs</div>
          </div>
          <div className="p-2 rounded bg-card/50 text-center">
            <div className="text-lg font-bold">{analysis.smc.bos.length}</div>
            <div className="text-xs text-muted-foreground">BOS Signals</div>
          </div>
        </div>

        {/* Trade Setups */}
        {analysis.setups.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Active Setups
            </div>
            <div className="space-y-2">
              {analysis.setups.slice(0, 3).map((setup) => (
                <div key={setup.id} className={`p-2 rounded border ${setup.direction === "Bullish"
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
                      <span className="font-medium">{setup.direction} {setup.setup}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {setup.confidence}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Entry: {setup.entryPrice.toFixed(2)} | SL: {setup.stopLoss.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Performance Stats
// ============================================================================

function PerformanceStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const logger = new TradeLoggerService();
    setStats(logger.calculateStats());
  }, []);

  if (!stats) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 text-center text-muted-foreground">
          No trades recorded yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Trading Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded bg-card/50">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className={`text-2xl font-bold ${stats.winRate >= 50 ? "text-green-500" : "text-yellow-500"}`}>
              {stats.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 rounded bg-card/50">
            <div className="text-sm text-muted-foreground">Profit Factor</div>
            <div className={`text-2xl font-bold ${stats.profitFactor >= 1.5 ? "text-green-500" : stats.profitFactor >= 1 ? "text-yellow-500" : "text-red-500"}`}>
              {stats.profitFactor.toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded bg-card/50">
            <div className="text-sm text-muted-foreground">Total P&L</div>
            <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
              ${stats.totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded bg-card/50">
            <div className="text-sm text-muted-foreground">Trades</div>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
          </div>
        </div>

        {/* Streaks */}
        <div className="flex gap-2">
          <div className="flex-1 p-2 rounded bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Best Streak</span>
            </div>
            <div className="text-lg font-bold">{stats.longestWinStreak}</div>
          </div>
          <div className="flex-1 p-2 rounded bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Worst Streak</span>
            </div>
            <div className="text-lg font-bold">{stats.longestLossStreak}</div>
          </div>
        </div>

        {/* Setup Performance */}
        {Object.keys(stats.setupPerformance).length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Performance by Setup</div>
            <div className="space-y-1">
              {Object.entries(stats.setupPerformance)
                .sort((a, b) => ((b[1] as any).wins + (b[1] as any).losses) - ((a[1] as any).wins + (a[1] as any).losses))
                .slice(0, 4)
                .map(([setup, data]) => {
                  const dataAny = data as any;
                  const total = dataAny.wins + dataAny.losses;
                  const wr = total > 0 ? (dataAny.wins / total) * 100 : 0;
                  return (
                    <div key={setup} className="flex items-center justify-between text-sm">
                      <span>{setup}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{total} trades</span>
                        <Badge variant="outline" className={`text-xs ${wr >= 50 ? "text-green-500" : "text-red-500"}`}>
                          {wr.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Pattern Scanner
// ============================================================================

function PatternScanner({ symbol }: { symbol: string }) {
  const [patterns, setPatterns] = useState<SmartMoneyPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatterns = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await AIIntelligenceService.getEnhancedSMCPatterns(symbol);
        setPatterns(result);
      } catch (err) {
        console.error("Pattern fetch failed:", err);
        setError("Pattern detection unavailable");
      } finally {
        setLoading(false);
      }
    };
    fetchPatterns();
  }, [symbol]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          SMC Patterns - {symbol}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-2 bg-yellow-500/10 text-yellow-500 rounded text-sm text-center">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : patterns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No patterns detected
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="p-3 rounded bg-card/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{pattern.concept}</div>
                    <div className="text-xs text-muted-foreground">{pattern.timeframe} timeframe</div>
                  </div>
                  <Badge className={
                    pattern.bias === "Bullish" ? "bg-green-500/20 text-green-500" :
                      pattern.bias === "Bearish" ? "bg-red-500/20 text-red-500" :
                        "bg-muted text-muted-foreground"
                  }>
                    {pattern.bias}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{pattern.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{pattern.zone}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={pattern.confidence} className="h-1 w-16" />
                    <span className="text-xs">{pattern.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Quick Backtest
// ============================================================================

function QuickBacktest({ symbol }: { symbol: string }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await MarketDataService.getHistoryFromPolygon(symbol);
      if (history.length > 0) {
        const engine = new SMCBacktestEngine(history, {
          initialCapital: 10000,
          riskPercent: 0.02,
          enableOB: true,
          enableFVG: true,
          enableCHOCH: true,
          enablePD: true,
          trendFilter: true,
        });
        const report = engine.run();
        setResult(report.result);
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Quick Backtest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded text-sm text-center">
            {error}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Test SMC strategy on {symbol} historical data
        </div>

        <Button onClick={runBacktest} disabled={loading} className="w-full">
          {loading ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Run Backtest</>
          )}
        </Button>

        {result && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-2 rounded bg-card/50 text-center">
              <div className="text-sm text-muted-foreground">Net P&L</div>
              <div className={`font-bold ${result.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${result.totalPnL.toFixed(2)}
              </div>
            </div>
            <div className="p-2 rounded bg-card/50 text-center">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="font-bold">{result.winRate.toFixed(1)}%</div>
            </div>
            <div className="p-2 rounded bg-card/50 text-center">
              <div className="text-sm text-muted-foreground">Trades</div>
              <div className="font-bold">{result.totalTrades}</div>
            </div>
            <div className="p-2 rounded bg-card/50 text-center">
              <div className="text-sm text-muted-foreground">Max DD</div>
              <div className="font-bold text-red-500">{result.maxDrawdown.toFixed(2)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function AIIntelligencePage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            SMC analysis, trade setups, and performance tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <KillZoneDisplay />
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
          <Button onClick={() => { }}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <SMCAnalysisCard symbol={symbol} />

          {activeTab === "patterns" && (
            <PatternScanner symbol={symbol} />
          )}

          {activeTab === "backtest" && (
            <div className="grid gap-6 md:grid-cols-2">
              <QuickBacktest symbol={symbol} />
              <PerformanceStats />
            </div>
          )}

          {activeTab === "performance" && (
            <PerformanceStats />
          )}
        </div>

        {/* Right Column - Stats & Tools */}
        <div className="space-y-6">
          <PerformanceStats />

          {activeTab === "analysis" && (
            <>
              <KillZoneDisplay />
              <QuickBacktest symbol={symbol} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
