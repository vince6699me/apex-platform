/**
 * Technical Analysis Page
 * 
 * Comprehensive technical & SMC analysis:
 * - Traditional indicators (RSI, SMA, EMA)
 * - Smart Money Concepts (Order Blocks, FVGs, Liquidity)
 * - Multi-timeframe analysis
 * - Actionable trading signals
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Label, Input, Separator, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/primitives";
import { SMCService, SMCAnalysis, getCurrentSMCSignal } from "../services/smcAnalysis";
import { MarketDataService } from "../services/marketData";
import { TechnicalIndicatorService } from "../services/technicalIndicators";
import { MultiTimeframeAnalysisService } from "../services/multiTimeframeAnalysis";
import { PatternRecognitionService } from "../services/patternRecognition";
import { MultiAssetService, ASSET_CLASSES, ASSET_CONFIG } from "../services/multiAssetData";
import { CandleData } from "../services/smcAnalysis";
import { Settings2, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Zap, Target, Shield, Activity, Globe, TrendingUpIcon, TrendingDownIcon } from "lucide-react";

// Indicator Configuration
interface IndicatorConfig {
  rsiPeriod: number;
  smaPeriod: number;
  emaPeriod: number;
  showSMC: boolean;
  showOB: boolean;
  showFVG: boolean;
  showLiquidity: boolean;
  selectedSymbol: string;
  selectedTimeframe: string;
}

export default function TechnicalAnalysis() {
  // Symbol & Asset Selection
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [assetClass, setAssetClass] = useState<string>("crypto");
  
  // SMC Data
  const [smcData, setSmcData] = useState<SMCAnalysis | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  
  // Indicator State
  const [config, setConfig] = useState<IndicatorConfig>({
    rsiPeriod: 14,
    smaPeriod: 50,
    emaPeriod: 20,
    showSMC: true,
    showOB: true,
    showFVG: true,
    showLiquidity: true,
    selectedSymbol: "BTC",
    selectedTimeframe: "1h"
  });

  // Load SMC data when symbol changes
  useEffect(() => {
    loadSMCData();
  }, [selectedSymbol]);

  const loadSMCData = () => {
    const { candles: newCandles, smc } = SMCService.generateSMCData(selectedSymbol, "bullish");
    setCandles(newCandles);
    setSmcData(smc);
  };

  // Calculate traditional indicators
  const priceData = candles.map(c => c.close);
  const rsi = priceData.length > 0 ? TechnicalIndicatorService.calculateRSI(priceData, config.rsiPeriod) : 0;
  const sma = priceData.length > 0 ? TechnicalIndicatorService.calculateSMA(priceData, config.smaPeriod) : [];
  const ema = priceData.length > 0 ? TechnicalIndicatorService.calculateEMA(priceData, config.emaPeriod) : [];
  
  const currentPrice = candles[candles.length - 1]?.close || 0;
  const currentSMA = sma[sma.length - 1]?.value || 0;
  const currentEMA = ema[ema.length - 1]?.value || 0;
  const smaTrend = sma.length > 1 ? (currentSMA > sma[sma.length - 2].value ? "Rising" : "Falling") : "Neutral";

  // SMC Signal
  const smcSignal = useMemo(() => {
    if (!smcData) return null;
    return getCurrentSMCSignal(smcData, currentPrice);
  }, [smcData, currentPrice]);

  // Traditional Trading Signal
  const tradingSignal = useMemo(() => {
    let score = 0;
    let reasons: string[] = [];

    // RSI
    if (rsi < 30) { score += 2; reasons.push("RSI Oversold"); }
    else if (rsi > 70) { score -= 2; reasons.push("RSI Overbought"); }
    
    // MA
    if (currentPrice > currentSMA) { score += 1; reasons.push("Price above SMA"); }
    else { score -= 1; reasons.push("Price below SMA"); }
    
    if (smaTrend === "Rising") { score += 1; reasons.push("SMA Trend Up"); }
    
    // SMC Bias
    if (smcSignal?.bias === "bullish") { score += 2; reasons.push("SMC Bullish"); }
    else if (smcSignal?.bias === "bearish") { score -= 2; reasons.push("SMC Bearish"); }

    return {
      action: score >= 2 ? "BUY" : score <= -2 ? "SELL" : "HOLD",
      strength: Math.abs(score) >= 3 ? "Strong" : "Weak",
      score,
      color: score > 0 ? "text-green-500" : score < 0 ? "text-red-500" : "text-yellow-500",
      reasons
    };
  }, [rsi, currentPrice, currentSMA, smaTrend, smcSignal]);

  // Multi-timeframe consensus
  const consensus = MultiTimeframeAnalysisService.getDetailedConsensus(selectedSymbol);

  // Render SMC Summary Card
  const renderSMCSummary = () => {
    if (!smcData) return null;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Market Structure */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Structure</span>
            </div>
            <Badge className={smcData.marketStructure.trend === "bullish" ? "bg-green-500" : smcData.marketStructure.trend === "bearish" ? "bg-red-500" : "bg-yellow-500"}>
              {smcData.marketStructure.trend.toUpperCase()}
            </Badge>
            <div className="mt-2 text-sm text-muted-foreground">
              {smcData.marketStructure.currentPricePosition === "premium" ? (
                <span className="text-red-400">Premium Zone (Sell)</span>
              ) : smcData.marketStructure.currentPricePosition === "discount" ? (
                <span className="text-green-400">Discount Zone (Buy)</span>
              ) : (
                <span className="text-yellow-400">Equilibrium</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Blocks */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Order Blocks</span>
            </div>
            <div className="flex gap-2 mb-2">
              <Badge variant="outline" className="border-green-500/50 text-green-500">
                {smcData.orderBlocks.filter(ob => ob.type === "bullish").length} Bullish
              </Badge>
              <Badge variant="outline" className="border-red-500/50 text-red-500">
                {smcData.orderBlocks.filter(ob => ob.type === "bearish").length} Bearish
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {smcData.orderBlocks.filter(ob => ob.isProximal).length} near price
            </div>
          </CardContent>
        </Card>

        {/* Fair Value Gaps */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Fair Value Gaps</span>
            </div>
            <div className="text-2xl font-bold">{smcData.fairValueGaps.length}</div>
            <div className="text-sm text-muted-foreground">
              {smcData.fairValueGaps.filter(f => !f.isMitigated).length} unfilled
            </div>
          </CardContent>
        </Card>

        {/* Liquidity */}
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-cyan-500" />
              <span className="font-medium">Liquidity Zones</span>
            </div>
            <div className="text-2xl font-bold">{smcData.liquidityZones.length}</div>
            <div className="text-sm text-muted-foreground">
              {smcData.liquidityZones.filter(z => z.strength === "strong").length} strong zones
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Technical Analysis</h1>
          <p className="text-muted-foreground mt-1">
            SMC + Traditional indicators for {selectedSymbol}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Asset Class Selector */}
          <Select value={assetClass} onValueChange={setAssetClass}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ASSET_CLASSES).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span>{val.icon}</span>
                    <span>{val.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Symbol Selector */}
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CONFIG[assetClass as keyof typeof ASSET_CONFIG]?.map((s: any) => (
                <SelectItem key={s.symbol} value={s.symbol}>
                  {s.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={loadSMCData}>
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SMC Summary Cards */}
      {config.showSMC && smcData && (
        <div className="space-y-4">
          {renderSMCSummary()}
          
          {/* SMC Trading Signal */}
          {smcSignal && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">SMC Signal</div>
                    <div className={`text-3xl font-bold ${smcSignal.bias === "bullish" ? "text-green-500" : smcSignal.bias === "bearish" ? "text-red-500" : "text-yellow-500"}`}>
                      {smcSignal.bias.toUpperCase()}
                    </div>
                    <Badge variant="outline" className="mt-2">{smcSignal.confidence}% Confidence</Badge>
                  </div>
                  
                  <div className="flex-1 grid md:grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Entry Zone</div>
                      <div className="font-mono text-sm">{smcSignal.entryZone}</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
                      <div className="font-mono text-sm text-red-400">{smcSignal.stopLoss}</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Target</div>
                      <div className="font-mono text-sm text-green-400">{smcSignal.target}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {smcSignal.reasons.map((reason, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actionable Trading Signal */}
      <Card className="border-l-4 border-l-primary shadow-lg bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Trading Signal (Traditional + SMC)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex flex-col items-center justify-center min-w-[140px] p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Signal</div>
              <div className={`text-4xl font-bold ${tradingSignal.color}`}>{tradingSignal.action}</div>
              <Badge variant="outline" className="mt-2">{tradingSignal.strength}</Badge>
            </div>
            
            <div className="flex-1 space-y-2 w-full">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                Confluence Factors
                <Badge variant="secondary" className="ml-auto text-xs">{tradingSignal.score > 0 ? "+" : ""}{tradingSignal.score} Score</Badge>
              </h4>
              <div className="flex flex-wrap gap-2">
                {tradingSignal.reasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-background/50 border border-border/40">
                    {tradingSignal.action === "BUY" ? <TrendingUpIcon className="h-4 w-4 text-green-500" /> : tradingSignal.action === "SELL" ? <TrendingDownIcon className="h-4 w-4 text-red-500" /> : null}
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> 
            Parameters 
            <Badge variant="secondary" className="ml-auto text-xs">
              {selectedSymbol} • {config.selectedTimeframe}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap text-xs">RSI Period</Label>
              <Input 
                type="number" 
                className="w-16 h-8" 
                value={config.rsiPeriod} 
                onChange={e => setConfig({...config, rsiPeriod: Number(e.target.value)})} 
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap text-xs">SMA Period</Label>
              <Input 
                type="number" 
                className="w-16 h-8" 
                value={config.smaPeriod} 
                onChange={e => setConfig({...config, smaPeriod: Number(e.target.value)})} 
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap text-xs">EMA Period</Label>
              <Input 
                type="number" 
                className="w-16 h-8" 
                value={config.emaPeriod} 
                onChange={e => setConfig({...config, emaPeriod: Number(e.target.value)})} 
              />
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap text-xs">Show SMC</Label>
              <input 
                type="checkbox" 
                checked={config.showSMC} 
                onChange={e => setConfig({...config, showSMC: e.target.checked})}
                className="w-4 h-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="indicators" className="space-y-6">
        <TabsList className="bg-muted/40 p-1">
          <TabsTrigger value="indicators" className="rounded-md">Indicators</TabsTrigger>
          <TabsTrigger value="smc" className="rounded-md">SMC Analysis</TabsTrigger>
          <TabsTrigger value="support-resistance" className="rounded-md">S&R Levels</TabsTrigger>
          <TabsTrigger value="multi-timeframe" className="rounded-md">Multi-Timeframe</TabsTrigger>
        </TabsList>
        
        {/* Indicators Tab */}
        <TabsContent value="indicators" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* RSI */}
            <Card>
              <CardHeader><CardTitle>Momentum (RSI)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold block">Relative Strength Index</span>
                    <span className="text-xs text-muted-foreground">Period: {config.rsiPeriod}</span>
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
                {/* RSI Bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${rsi > 70 ? "bg-red-500" : rsi < 30 ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(rsi, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>30</span>
                  <span>50</span>
                  <span>70</span>
                  <span>100</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Moving Averages */}
            <Card>
              <CardHeader><CardTitle>Trend Indicators</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold block">SMA ({config.smaPeriod})</span>
                    <span className="text-xs text-muted-foreground">Simple Moving Average</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg">{currentSMA.toFixed(2)}</span>
                    <div className={`text-xs mt-1 ${smaTrend === "Rising" ? "text-green-500" : "text-red-500"}`}>
                      {smaTrend}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold block">EMA ({config.emaPeriod})</span>
                    <span className="text-xs text-muted-foreground">Exponential MA</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg">{currentEMA.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SMC Analysis Tab */}
        <TabsContent value="smc" className="space-y-6">
          {smcData ? (
            <>
              {/* Order Blocks */}
              <Card className="border-border/60">
                <CardHeader className="border-b border-border/40">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Order Blocks
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {smcData.orderBlocks.slice(0, 6).map((ob, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${ob.type === "bullish" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Badge className={ob.type === "bullish" ? "bg-green-500" : "bg-red-500"}>
                            {ob.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={ob.isProximal ? "border-primary text-primary" : ""}>
                            {ob.isProximal ? "Near Price" : "Distance"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Zone</div>
                            <div className="font-mono">{ob.priceLow.toFixed(2)} - {ob.priceHigh.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Strength</div>
                            <Badge variant="secondary">{ob.strength}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fair Value Gaps */}
              <Card className="border-border/60">
                <CardHeader className="border-b border-border/40">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Fair Value Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    {smcData.fairValueGaps.filter(f => !f.isMitigated).slice(0, 6).map((fvg, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${fvg.type === "bullish" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Badge className={fvg.type === "bullish" ? "bg-green-500" : "bg-red-500"}>
                            {fvg.type.toUpperCase()}
                          </Badge>
                          <Badge variant={fvg.isFavorableEntry ? "default" : "outline"}>
                            {fvg.isFavorableEntry ? "Favorable" : "Mitigated"}
                          </Badge>
                        </div>
                        <div className="text-sm font-mono">
                          {fvg.low.toFixed(2)} - {fvg.high.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Size: {fvg.size.toFixed(2)} • {fvg.filledPercent.toFixed(0)}% filled
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Liquidity Zones */}
              <Card className="border-border/60">
                <CardHeader className="border-b border-border/40">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-cyan-500" />
                    Liquidity Zones
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {smcData.liquidityZones.slice(0, 8).map((zone, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${zone.type.includes("high") ? "border-red-500/30 bg-red-500/5" : "border-green-500/30 bg-green-500/5"}`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline" className={zone.type.includes("high") ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}>
                            {zone.type.replace("_", " ").toUpperCase()}
                          </Badge>
                          <Badge variant="secondary">{zone.touchCount} touches</Badge>
                        </div>
                        <div className="text-sm font-mono font-bold">
                          {zone.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="p-10 text-center text-muted-foreground">Loading SMC data...</CardContent></Card>
          )}
        </TabsContent>

        {/* Support & Resistance Tab */}
        <TabsContent value="support-resistance" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="border-b border-border/40">
              <CardTitle>Support & Resistance Levels - {selectedSymbol}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
              {/* Support */}
              <div className="space-y-4">
                <h3 className="text-green-500 font-medium flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4" /> Support Levels
                </h3>
                <div className="space-y-3">
                  {smcData?.liquidityZones.filter(z => z.type === "low" || z.type === "equal_low").slice(0, 5).map((lvl, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                      <div>
                        <div className="text-lg font-bold text-green-500">${lvl.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{lvl.touchCount} touches • {lvl.strength}</div>
                      </div>
                      {lvl.isSwept && <Badge variant="destructive" className="text-xs">Swept</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resistance */}
              <div className="space-y-4">
                <h3 className="text-red-500 font-medium flex items-center gap-2">
                  <TrendingDownIcon className="h-4 w-4" /> Resistance Levels
                </h3>
                <div className="space-y-3">
                  {smcData?.liquidityZones.filter(z => z.type === "high" || z.type === "equal_high").slice(0, 5).map((lvl, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                      <div>
                        <div className="text-lg font-bold text-red-500">${lvl.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{lvl.touchCount} touches • {lvl.strength}</div>
                      </div>
                      {lvl.isSwept && <Badge variant="destructive" className="text-xs">Swept</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Timeframe Tab */}
        <TabsContent value="multi-timeframe" className="space-y-6">
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <CardTitle>Multi-Timeframe Consensus - {selectedSymbol}</CardTitle>
                <Badge className={consensus.overallBias === "Bullish" ? "bg-green-500" : consensus.overallBias === "Bearish" ? "bg-red-500" : "bg-secondary"}>
                  {consensus.overallBias}
                </Badge>
              </div>
            </CardHeader>
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Overall Strength</div>
                <div className="text-2xl font-bold">{consensus.overallStrength}</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Agreement</div>
                <div className="text-2xl font-bold">{consensus.timeframeAgreement}</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground mb-1">Conflicts</div>
                <div className="text-2xl font-bold">{consensus.conflicts}</div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {consensus.timeframes.map((tf, index) => (
              <Card key={index} className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tf.timeframe}</CardTitle>
                  <Badge className={tf.bias === "Bullish" ? "bg-green-500" : tf.bias === "Bearish" ? "bg-red-500" : "bg-secondary"} w-fit>
                    {tf.bias}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm mb-4">
                    <span>Strength: <strong>{tf.strength}/100</strong></span>
                    <span>Confidence: <strong>{tf.confidence}%</strong></span>
                  </div>
                  <div className="space-y-2">
                    {tf.keySignals.slice(0, 3).map((sig, i) => (
                      <div key={i} className="flex justify-between text-xs border-b border-border/30 pb-1">
                        <span>{sig.name}</span>
                        <span className="font-mono">{sig.value}</span>
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
