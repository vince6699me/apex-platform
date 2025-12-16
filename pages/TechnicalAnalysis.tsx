
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Label, Input, Separator, Button } from "../components/ui/primitives";
import { MarketDataService } from "../services/marketData";
import { TechnicalIndicatorService } from "../services/technicalIndicators";
import { MultiTimeframeAnalysisService } from "../services/multiTimeframeAnalysis";
import { PatternRecognitionService } from "../services/patternRecognition";
import { Settings2, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TechnicalAnalysis() {
  // Configuration State
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [smaPeriod, setSmaPeriod] = useState(50);
  const [emaPeriod, setEmaPeriod] = useState(20);

  // Data Calculation
  const data = MarketDataService.generateHistoricalData("AAPL", 150).map(d => d.close);
  const rsi = TechnicalIndicatorService.calculateRSI(data, rsiPeriod);
  const sma = TechnicalIndicatorService.calculateSMA(data, smaPeriod);
  const curSMA = sma[sma.length - 1]?.value || 0;
  const ema = TechnicalIndicatorService.calculateEMA(data, emaPeriod);
  const curEMA = ema[ema.length - 1]?.value || 0;
  const price = data[data.length - 1];
  
  // Trend determination based on SMA
  const prevSMA = sma[sma.length - 2]?.value || 0;
  const smaTrend = curSMA > prevSMA ? "Rising" : "Falling";

  // Actionable Signal Logic
  const tradingSignal = useMemo(() => {
      let score = 0;
      let reasons: string[] = [];

      // RSI Logic
      if (rsi < 30) { score += 2; reasons.push("RSI Oversold (<30)"); }
      else if (rsi > 70) { score -= 2; reasons.push("RSI Overbought (>70)"); }
      
      // MA Logic
      if (price > curSMA) { score += 1; reasons.push("Price above SMA"); }
      else { score -= 1; reasons.push("Price below SMA"); }

      // Trend Logic
      if (smaTrend === "Rising") { score += 1; reasons.push("MA Trend Rising"); }
      else { score -= 1; reasons.push("MA Trend Falling"); }

      // EMA Cross Logic (Simulated)
      if (price > curEMA && curEMA > curSMA) { score += 1; reasons.push("Strong Momentum (Price > EMA > SMA)"); }

      let action: "BUY" | "SELL" | "HOLD" = "HOLD";
      let strength = "Neutral";
      let color = "text-yellow-500";
      
      if (score >= 3) { action = "BUY"; strength = "Strong Buy"; color = "text-green-500"; }
      else if (score >= 1) { action = "BUY"; strength = "Weak Buy"; color = "text-green-400"; }
      else if (score <= -3) { action = "SELL"; strength = "Strong Sell"; color = "text-red-500"; }
      else if (score <= -1) { action = "SELL"; strength = "Weak Sell"; color = "text-red-400"; }

      return { action, strength, color, reasons, score };
  }, [rsi, curSMA, curEMA, price, smaTrend]);

  // New Services Data
  const consensus = MultiTimeframeAnalysisService.getDetailedConsensus("AAPL");
  const srLevels = PatternRecognitionService.detectSupportResistance([]);
  const supportLevels = srLevels.filter(l => l.type === "support");
  const resistanceLevels = srLevels.filter(l => l.type === "resistance");

  const getBiasBadge = (bias: string) => {
    switch(bias) {
      case 'Bullish': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
      case 'Bearish': return 'bg-red-500 hover:bg-red-600 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-20">
      <div>
          <h1 className="text-3xl font-bold">Technical Analysis</h1>
          <p className="text-muted-foreground mt-1">Advanced indicators and multi-timeframe analysis</p>
      </div>
      
      {/* New Actionable Signals Section */}
      <Card className="border-l-4 border-l-primary shadow-lg bg-card/60">
        <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Actionable Trading Signal
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex flex-col items-center justify-center min-w-[150px] p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Signal</div>
                    <div className={`text-4xl font-bold ${tradingSignal.color}`}>{tradingSignal.action}</div>
                    <Badge variant="outline" className="mt-2">{tradingSignal.strength}</Badge>
                </div>
                
                <div className="flex-1 space-y-3 w-full">
                    <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        Confluence Factors
                        <Badge variant="secondary" className="ml-auto text-xs">{tradingSignal.score > 0 ? "+" : ""}{tradingSignal.score} Score</Badge>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tradingSignal.reasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-md bg-background/50 border border-border/40">
                                {tradingSignal.action === "BUY" ? <TrendingUp className="h-4 w-4 text-green-500"/> : <TrendingDown className="h-4 w-4 text-red-500"/>}
                                {r}
                            </div>
                        ))}
                        {tradingSignal.reasons.length === 0 && <div className="text-muted-foreground text-sm italic">No strong directional signals derived from current parameters.</div>}
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[140px]">
                     <Button className="w-full gap-2" variant={tradingSignal.action === "BUY" ? "default" : tradingSignal.action === "SELL" ? "destructive" : "secondary"}>
                        {tradingSignal.action === "BUY" ? "Execute Buy" : tradingSignal.action === "SELL" ? "Execute Sell" : "Set Alert"}
                        <ArrowRight className="h-4 w-4" />
                     </Button>
                     <p className="text-[10px] text-muted-foreground text-center">AI Confidence: 78%</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="indicators" className="space-y-6">
        <TabsList className="bg-muted/40 p-1">
            <TabsTrigger value="indicators" className="rounded-md">Indicators</TabsTrigger>
            <TabsTrigger value="patterns" className="rounded-md">Patterns</TabsTrigger>
            <TabsTrigger value="support-resistance" className="rounded-md">Support & Resistance</TabsTrigger>
            <TabsTrigger value="multi-timeframe" className="rounded-md">Multi-Timeframe</TabsTrigger>
        </TabsList>
        
        {/* Indicators Tab */}
        <TabsContent value="indicators" className="space-y-6">
            <Card className="bg-muted/30 border-dashed">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4"/> Parameters</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-3">
                            <Label className="whitespace-nowrap">RSI Period</Label>
                            <Input type="number" className="w-20 h-8" value={rsiPeriod} onChange={e => setRsiPeriod(Number(e.target.value))} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label className="whitespace-nowrap">SMA Period</Label>
                            <Input type="number" className="w-20 h-8" value={smaPeriod} onChange={e => setSmaPeriod(Number(e.target.value))} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label className="whitespace-nowrap">EMA Period</Label>
                            <Input type="number" className="w-20 h-8" value={emaPeriod} onChange={e => setEmaPeriod(Number(e.target.value))} />
                        </div>
                    </div>
                </CardContent>
            </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Momentum Indicators</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold block">Relative Strength Index</span>
                            <span className="text-xs text-muted-foreground">Period: {rsiPeriod}</span>
                        </div>
                        <div className="text-right">
                             <Badge className={rsi > 70 ? "bg-red-500" : rsi < 30 ? "bg-green-500" : "bg-primary"}>
                                {rsi.toFixed(2)}
                            </Badge>
                            <div className="text-xs mt-1 text-muted-foreground">
                                {rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral"}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Trend Indicators</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-semibold block">Simple Moving Average</span>
                            <span className="text-xs text-muted-foreground">Period: {smaPeriod}</span>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-lg">{curSMA.toFixed(2)}</span>
                            <div className={`text-xs mt-1 ${smaTrend === 'Rising' ? 'text-green-500' : 'text-red-500'}`}>
                                {smaTrend}
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                         <div>
                            <span className="font-semibold block">Exponential Moving Average</span>
                            <span className="text-xs text-muted-foreground">Period: {emaPeriod}</span>
                        </div>
                         <div className="text-right">
                            <span className="font-mono text-lg">{curEMA.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <Card><CardContent className="p-10 text-center text-muted-foreground">Pattern recognition visualization module loaded.</CardContent></Card>
        </TabsContent>

        {/* Support & Resistance Tab */}
        <TabsContent value="support-resistance" className="space-y-6">
            <Card className="border-border/60 bg-card/40">
                <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-xl">Support & Resistance Levels - AAPL</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                    {/* Support Levels */}
                    <div className="space-y-4">
                        <h3 className="text-green-500 font-medium">Support Levels</h3>
                        <div className="space-y-3">
                            {supportLevels.map((lvl, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                                    <div>
                                        <div className="text-lg font-bold text-green-500">${lvl.price.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">{lvl.touches} touches</div>
                                    </div>
                                    <Badge variant="outline" className="border-green-500/40 text-green-500">Strength: {lvl.strength}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resistance Levels */}
                    <div className="space-y-4">
                        <h3 className="text-red-500 font-medium">Resistance Levels</h3>
                         <div className="space-y-3">
                            {resistanceLevels.map((lvl, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                                    <div>
                                        <div className="text-lg font-bold text-red-500">${lvl.price.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">{lvl.touches} touches</div>
                                    </div>
                                    <Badge variant="outline" className="border-red-500/40 text-red-500">Strength: {lvl.strength}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* Multi-Timeframe Tab */}
        <TabsContent value="multi-timeframe" className="space-y-6">
            {/* Consensus Header */}
            <Card className="border-border/60 bg-card/40 overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">Consensus Analysis - AAPL</CardTitle>
                        <Badge className={`${getBiasBadge(consensus.overallBias)} px-3 py-1 text-xs`}>{consensus.overallBias}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Overall Strength</div>
                            <div className="text-2xl font-bold">{consensus.overallStrength}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Timeframe Agreement</div>
                            <div className="text-2xl font-bold">{consensus.timeframeAgreement}</div>
                        </div>
                        <div>
                             <div className="text-xs text-muted-foreground mb-1">Conflicts</div>
                             <div className="text-2xl font-bold">{consensus.conflicts}</div>
                        </div>
                    </div>
                </CardHeader>
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mx-6 my-4 rounded-r-md">
                    <div className="flex items-center gap-2 text-yellow-500 font-semibold mb-1">
                        <AlertTriangle className="h-4 w-4" /> Conflicting Signals
                    </div>
                    <p className="text-sm text-muted-foreground">{consensus.conflictDescription}</p>
                </div>
            </Card>

            {/* Timeframe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {consensus.timeframes.map((tf, index) => (
                    <Card key={index} className="border-border/60 bg-card/40">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-base font-semibold">{tf.timeframe}</CardTitle>
                            <Badge className={`${getBiasBadge(tf.bias)} text-[10px]`}>{tf.bias}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Strength</div>
                                    <div className="text-lg font-bold">{tf.strength}/100</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                                    <div className="text-lg font-bold">{tf.confidence}%</div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="text-xs text-muted-foreground mb-2">Key Signals:</div>
                                {tf.keySignals.map((signal, sIndex) => (
                                    <div key={sIndex} className="flex justify-between items-center text-sm border-b border-border/30 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-2">
                                            {/* Small line to simulate bullet or chart line */}
                                            <div className={`w-2 h-0.5 ${sIndex === 0 ? 'bg-muted-foreground' : sIndex === 1 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                            <span>{signal.name}</span>
                                        </div>
                                        <span className="font-mono font-medium">{signal.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
