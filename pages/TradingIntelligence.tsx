
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Textarea, Label } from "../components/ui/primitives";
import { Play, Activity, Gauge, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { AIIntelligenceService } from "../services/aiIntelligence";
import { ConfluenceAnalysis, PrioritySignal } from "../types";

export default function TradingIntelligence() {
  const [symbol, setSymbol] = useState("AAPL");
  const [analysis, setAnalysis] = useState<ConfluenceAnalysis | null>(null);
  const [signals, setSignals] = useState<PrioritySignal[]>([]);
  const [code, setCode] = useState(`//@version=5
strategy("Apex Capital Prototype", overlay=true)
emaFast = ta.ema(close, 21)
emaSlow = ta.ema(close, 55)
long = ta.crossover(emaFast, emaSlow)
short = ta.crossunder(emaFast, emaSlow)
if long
    strategy.entry("Long", strategy.long)
if short
    strategy.entry("Short", strategy.short)`);
  
  const [backtestResult, setBacktestResult] = useState<boolean>(false);

  useEffect(() => {
    // Load initial data
    setAnalysis(AIIntelligenceService.getConfluenceAnalysis(symbol));
    setSignals(AIIntelligenceService.getPrioritySignals());
  }, [symbol]);

  const runBacktest = () => {
    setBacktestResult(true);
  };

  const getBiasColor = (bias?: string) => {
    if (bias === "Bullish") return "text-yellow-500";
    if (bias === "Bearish") return "text-red-500";
    return "text-muted-foreground";
  };

  const getBadgeVariant = (bias?: string) => {
      if (bias === "Bullish") return "default"; // Using default primary color for Bullish in this theme map (Yellow)
      if (bias === "Bearish") return "destructive";
      return "secondary";
  };

  if (!analysis) return null;

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-24">
      <div>
        <h1 className="text-3xl font-bold">Trading Intelligence Lab</h1>
        <p className="text-muted-foreground mt-1">Fuse AI signals, technical confluence, and PineScript backtesting to refine execution.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Signal Confluence */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5" /> Signal Confluence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Top Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground ml-1">Focus Symbol</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      value={symbol} 
                      onChange={e => setSymbol(e.target.value.toUpperCase())} 
                      className="w-32 font-bold font-mono tracking-wide"
                    />
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-mono">Spot ${analysis.spotPrice}</Badge>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-mono">ATR {analysis.atr}</Badge>
                    </div>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 space-y-1">
                     <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Consensus Score</span>
                         <span className="font-bold">{analysis.consensusScore}%</span>
                     </div>
                     <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${analysis.consensusScore}%` }} />
                     </div>
                </div>
              </div>

              {/* Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Technical Bias */}
                 <Card className="bg-card/60 border-border/60">
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Technical Bias</div>
                            <div className={`text-2xl font-bold ${getBiasColor(analysis.technicalBias.bias)}`}>
                                {analysis.technicalBias.bias}
                            </div>
                            <div className="text-sm text-muted-foreground">RSI: {analysis.technicalBias.rsiState}</div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-b border-border/50 pb-1">
                                <span className="text-muted-foreground">SMA 20 / 50</span>
                                <span className="font-mono">{analysis.technicalBias.sma20} / {analysis.technicalBias.sma50}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">EMA 20</span>
                                <span className="font-mono">{analysis.technicalBias.ema20}</span>
                            </div>
                        </div>
                    </CardContent>
                 </Card>

                 {/* AI Pattern Scan */}
                 <Card className="bg-card/60 border-border/60">
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">AI Pattern Scan</div>
                            <div className={`text-2xl font-bold ${getBiasColor(analysis.aiPatternScan.bias)}`}>
                                {analysis.aiPatternScan.bias}
                            </div>
                            <div className="text-sm text-muted-foreground">Score: {analysis.aiPatternScan.score}</div>
                        </div>
                        <div className="space-y-2">
                            {analysis.aiPatternScan.patterns.map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{p.name}</span>
                                    <Badge variant={getBadgeVariant(p.bias)} className="text-xs h-5 px-1.5">{p.bias}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                 </Card>
              </div>

              {/* Bottom Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                      <div className="text-sm text-muted-foreground mb-1">Sentiment</div>
                      <div className={`text-lg font-bold ${getBiasColor(analysis.summary.sentiment.bias)}`}>
                          {analysis.summary.sentiment.bias}
                      </div>
                      <div className="text-sm text-muted-foreground">{analysis.summary.sentiment.score} score</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                      <div className="text-sm text-muted-foreground mb-1">Anomalies</div>
                      <div className="text-lg font-bold">{analysis.summary.anomalies}</div>
                      <div className="text-sm text-muted-foreground">Active smart alerts</div>
                  </div>
                  <div className="p-4 rounded-xl border border-border/60 bg-card/40">
                      <div className="text-sm text-muted-foreground mb-1">SMC Setups</div>
                      <div className="text-lg font-bold">{analysis.summary.smcSetups}</div>
                      <div className="text-sm text-muted-foreground">Liquidity & FVG reads</div>
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* PineScript Lab - Moved below Signal Confluence in layout flow for mobile/desktop harmony */}
          <Card className="border-border/50 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" /> PineScript Backtesting Lab
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Symbol</Label>
                        <Input defaultValue="AAPL" className="h-9 font-mono" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Timeframe</Label>
                        <Input defaultValue="1h" className="h-9 font-mono" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Initial Capital</Label>
                        <Input defaultValue="100000" className="h-9 font-mono" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-sm text-muted-foreground">PineScript Strategy</Label>
                            <Textarea 
                                value={code} 
                                onChange={e => setCode(e.target.value)} 
                                className="font-mono text-sm h-[200px] bg-background/50 resize-none leading-relaxed" 
                                spellCheck={false}
                            />
                        </div>
                        <Button className="w-40 gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" onClick={runBacktest}>
                            <Play className="h-4 w-4 fill-current" /> Run Backtest
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="h-3 w-3"/> Backtest Results</Label>
                        <div className="h-[200px] rounded-md border border-dashed border-border flex items-center justify-center bg-muted/10">
                            {backtestResult ? (
                                <div className="text-center space-y-2 p-6 animate-fade-in">
                                    <div className="text-2xl font-bold text-green-500">+12.4%</div>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground text-left">
                                        <span>Net Profit: $12,400</span>
                                        <span>Trades: 42</span>
                                        <span>Win Rate: 64%</span>
                                        <span>Profit Factor: 1.85</span>
                                        <span>Max DD: 4.2%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground space-y-2">
                                    <Activity className="h-8 w-8 mx-auto opacity-50" />
                                    <p className="text-sm">Run a backtest to see expectancy, win rate, and drawdown projections.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Priority Signals */}
        <div className="space-y-6">
            <Card className="border-border/50 bg-card/40 h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5" /> Priority Signals
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {signals.map((sig) => (
                        <Card key={sig.id} className="bg-card/60 border-border/60 transition-colors hover:bg-card/80">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="text-xs text-muted-foreground">{sig.subtitle}</div>
                                    <Badge variant="secondary" className="bg-muted text-xs">{sig.edge}% edge</Badge>
                                </div>
                                <div>
                                    <div className={`text-lg font-bold ${getBiasColor(sig.title === "Bullish" ? "Bullish" : sig.bias)}`}>
                                        {sig.title}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        {sig.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    <div className="pt-4">
                        <Button variant="outline" className="w-full text-xs h-8 border-dashed">View All Signals</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
