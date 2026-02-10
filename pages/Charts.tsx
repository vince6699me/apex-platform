/**
 * Advanced Charts Page
 * 
 * Full-featured charting with:
 * - Multi-asset symbol selection
 * - Traditional indicators
 * - SMC overlays (Order Blocks, FVGs, Liquidity)
 * - Preset configurations
 */

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Separator, Switch, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/primitives";
import { CandlestickChart, IndicatorConfig } from "../components/Charts/CandlestickChart";
import { SMCService, SMCAnalysis, getCurrentSMCSignal, CandleData } from "../services/smcAnalysis";
import { Settings2, Plus, Trash2, Save, Zap, Eye, EyeOff, RotateCcw, Target, Zap as ZapIcon, Shield, Activity, Globe } from "lucide-react";
import { toast } from "sonner";
import { ASSET_CLASSES, ASSET_CONFIG, MultiAssetService } from "../services/multiAssetData";

export default function Charts() {
  // Asset & Symbol Selection
  const [assetClass, setAssetClass] = useState("crypto");
  const [symbol, setSymbol] = useState("BTC");
  const [timeframe, setTimeframe] = useState("1h");
  
  // Chart Data
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [smcData, setSmcData] = useState<SMCAnalysis | null>(null);
  
  // Display Options
  const [showVolume, setShowVolume] = useState(true);
  const [showSMC, setShowSMC] = useState(true);
  const [showOB, setShowOB] = useState(true);
  const [showFVG, setShowFVG] = useState(true);
  const [showLiquidity, setShowLiquidity] = useState(true);
  
  // Indicators
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  
  // New Indicator State
  const [newType, setNewType] = useState("SMA");
  const [newPeriod, setNewPeriod] = useState("20");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newSource, setNewSource] = useState<"close" | "open" | "high" | "low">("close");
  const [newStdDev, setNewStdDev] = useState("2");
  const [newFastPeriod, setNewFastPeriod] = useState("12");
  const [newSlowPeriod, setNewSlowPeriod] = useState("26");
  const [newSignalPeriod, setNewSignalPeriod] = useState("9");

  // Load chart data when symbol changes
  useEffect(() => {
    loadChartData();
  }, [symbol, timeframe]);

  const loadChartData = () => {
    const { candles: newCandles, smc } = SMCService.generateSMCData(symbol, "bullish");
    setCandles(newCandles);
    setSmcData(smc);
    
    // Reset to default indicators for new symbol
    setIndicators([
      { id: '1', type: 'SMA', period: 50, color: '#3b82f6', lineWidth: 2, source: 'close' },
      { id: '2', type: 'EMA', period: 20, color: '#eab308', lineWidth: 2, source: 'close' }
    ]);
    
    toast.info(`${symbol} loaded`, { description: `${symbol} • ${timeframe} • ${newCandles.length} candles` });
  };

  // SMC Signal
  const smcSignal = useMemo(() => {
    if (!smcData) return null;
    return getCurrentSMCSignal(smcData, candles[candles.length - 1]?.close || 0);
  }, [smcData, candles]);

  // Save configuration
  const saveConfiguration = () => {
    const config = { symbol, timeframe, indicators, showVolume, showSMC, showOB, showFVG, showLiquidity };
    localStorage.setItem("apexChartConfig", JSON.stringify(config));
    toast.success("Configuration Saved");
  };

  // Add indicator
  const addIndicator = () => {
    const newInd: IndicatorConfig = {
      id: Math.random().toString(36).substr(2, 9),
      type: newType,
      color: newColor,
      lineWidth: 2,
      source: newSource
    };

    if (newType === "BB") {
      newInd.period = parseInt(newPeriod);
      newInd.stdDev = parseFloat(newStdDev);
    } else if (newType === "MACD") {
      newInd.fastPeriod = parseInt(newFastPeriod);
      newInd.slowPeriod = parseInt(newSlowPeriod);
      newInd.signalPeriod = parseInt(newSignalPeriod);
    } else {
      newInd.period = parseInt(newPeriod);
    }
    
    setIndicators([...indicators, newInd]);
    toast.success(`Added ${newType}`);
  };

  // Remove indicator
  const removeIndicator = (id: string) => {
    setIndicators(indicators.filter(i => i.id !== id));
  };

  // Apply preset
  const applyPreset = (preset: string) => {
    const genId = () => Math.random().toString(36).substr(2, 9);
    
    switch (preset) {
      case 'MACD + RSI':
        setIndicators([
          { id: genId(), type: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#22c55e', lineWidth: 1, source: 'close' },
          { id: genId(), type: 'RSI', period: 14, color: '#8b5cf6', lineWidth: 2, source: 'close' }
        ]);
        break;
      case 'BB + SMA50':
        setIndicators([
          { id: genId(), type: 'BB', period: 20, stdDev: 2, color: '#3b82f6', lineWidth: 1, source: 'close' },
          { id: genId(), type: 'SMA', period: 50, color: '#eab308', lineWidth: 2, source: 'close' }
        ]);
        break;
      case 'Golden Cross':
        setIndicators([
          { id: genId(), type: 'SMA', period: 50, color: '#eab308', lineWidth: 2, source: 'close' },
          { id: genId(), type: 'SMA', period: 200, color: '#3b82f6', lineWidth: 3, source: 'close' }
        ]);
        break;
    }
    toast.success(`Preset: ${preset}`);
  };

  // SMC Overlays configuration
  const getSMCOverlays = () => {
    if (!showSMC) return [];
    
    const overlays: any[] = [];
    
    if (showOB && smcData) {
      smcData.orderBlocks.slice(0, 5).forEach((ob, i) => {
        overlays.push({
          type: 'orderBlock',
          id: ob.id,
          startIndex: ob.startIndex,
          endIndex: ob.endIndex,
          priceHigh: ob.priceHigh,
          priceLow: ob.priceLow,
          isBullish: ob.type === 'bullish',
          strength: ob.strength
        });
      });
    }
    
    if (showFVG && smcData) {
      smcData.fairValueGaps.filter(f => !f.isMitigated).slice(0, 5).forEach((fvg, i) => {
        overlays.push({
          type: 'fvg',
          id: fvg.id,
          index: fvg.index,
          high: fvg.high,
          low: fvg.low,
          isBullish: fvg.type === 'bullish'
        });
      });
    }
    
    if (showLiquidity && smcData) {
      smcData.liquidityZones.slice(0, 8).forEach((zone, i) => {
        overlays.push({
          type: 'liquidity',
          id: zone.id,
          price: zone.price,
          isHigh: zone.type.includes('high'),
          strength: zone.strength
        });
      });
    }
    
    return overlays;
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Advanced Charts</h1>
          <p className="text-muted-foreground mt-1">
            {symbol} • {timeframe} • {candles.length} candles
            {smcSignal && (
              <Badge className={`ml-2 ${smcSignal.bias === 'bullish' ? 'bg-green-500' : smcSignal.bias === 'bearish' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                {smcSignal.bias.toUpperCase()} ({smcSignal.confidence}%)
              </Badge>
            )}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Asset Class */}
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
          
          {/* Symbol */}
          <Select value={symbol} onValueChange={setSymbol}>
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
          
          {/* Timeframe */}
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="4h">4h</SelectItem>
              <SelectItem value="1d">1D</SelectItem>
            </SelectContent>
          </Select>

          {/* View Options */}
          <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5">
            <Switch id="vol-toggle" checked={showVolume} onCheckedChange={setShowVolume} />
            <Label htmlFor="vol-toggle" className="text-xs cursor-pointer">Vol</Label>
          </div>
          
          <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5">
            <Switch id="smc-toggle" checked={showSMC} onCheckedChange={setShowSMC} />
            <Label htmlFor="smc-toggle" className="text-xs cursor-pointer">SMC</Label>
          </div>

          {/* Indicator Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" /> Indicators
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Configure Chart</DialogTitle></DialogHeader>
              <div className="space-y-6">
                {/* Presets */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs" onClick={() => applyPreset('MACD + RSI')}>
                      <Zap className="h-3 w-3" /> MACD + RSI
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs" onClick={() => applyPreset('BB + SMA50')}>
                      <Zap className="h-3 w-3" /> BB + SMA50
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs" onClick={() => applyPreset('Golden Cross')}>
                      <Zap className="h-3 w-3" /> Golden Cross
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs ml-auto text-muted-foreground" onClick={loadChartData}>
                      <RotateCcw className="h-3 w-3" /> Reset
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* SMC Options */}
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">SMC Overlays</Label>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Switch id="show-ob" checked={showOB} onCheckedChange={setShowOB} />
                      <Label htmlFor="show-ob" className="text-xs flex items-center gap-1">
                        <Target className="h-3 w-3 text-purple-500" /> Order Blocks
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="show-fvg" checked={showFVG} onCheckedChange={setShowFVG} />
                      <Label htmlFor="show-fvg" className="text-xs flex items-center gap-1">
                        <ZapIcon className="h-3 w-3 text-amber-500" /> FVGs
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="show-li" checked={showLiquidity} onCheckedChange={setShowLiquidity} />
                      <Label htmlFor="show-li" className="text-xs flex items-center gap-1">
                        <Shield className="h-3 w-3 text-cyan-500" /> Liquidity
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Add Indicator */}
                <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  <Label className="text-sm font-medium">Add Indicator</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Type</Label>
                      <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMA">SMA</SelectItem>
                          <SelectItem value="EMA">EMA</SelectItem>
                          <SelectItem value="RSI">RSI</SelectItem>
                          <SelectItem value="BB">Bollinger Bands</SelectItem>
                          <SelectItem value="MACD">MACD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-8 w-10 p-1" />
                        <div className="flex-1 h-8 bg-background border rounded opacity-50 text-xs flex items-center px-2">{newColor}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Source</Label>
                      <Select value={newSource} onValueChange={(v: any) => setNewSource(v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="close">Close</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(newType === "SMA" || newType === "EMA" || newType === "RSI" || newType === "BB") && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Period</Label>
                        <Input type="number" value={newPeriod} onChange={e => setNewPeriod(e.target.value)} className="h-8" />
                      </div>
                    )}
                    {newType === "BB" && (
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Std Dev</Label>
                        <Input type="number" value={newStdDev} onChange={e => setNewStdDev(e.target.value)} className="h-8" />
                      </div>
                    )}
                    {newType === "MACD" && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Fast</Label>
                          <Input type="number" value={newFastPeriod} onChange={e => setNewFastPeriod(e.target.value)} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Slow</Label>
                          <Input type="number" value={newSlowPeriod} onChange={e => setNewSlowPeriod(e.target.value)} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Signal</Label>
                          <Input type="number" value={newSignalPeriod} onChange={e => setNewSignalPeriod(e.target.value)} className="h-8" />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button onClick={addIndicator} className="w-full gap-2 h-8">
                    <Plus className="h-4 w-4" /> Add Indicator
                  </Button>
                </div>
                
                {/* Active Indicators */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Active Indicators</Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {indicators.length === 0 && <p className="text-sm text-muted-foreground italic">No indicators active.</p>}
                    {indicators.map(ind => (
                      <div key={ind.id} className="flex items-center justify-between p-2 border rounded-md bg-card shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ind.color }}></div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm leading-none">{ind.type}</span>
                              <span className="text-[9px] px-1 bg-muted rounded text-muted-foreground uppercase">{ind.source || 'Close'}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {ind.type === "BB" ? `${ind.period} / ${ind.stdDev} SD` : 
                               ind.type === "MACD" ? `${ind.fastPeriod}-${ind.slowPeriod}-${ind.signalPeriod}` : 
                               `${ind.period} Period`}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeIndicator(ind.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="icon" onClick={saveConfiguration} title="Save Config">
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {symbol} - {timeframe}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showSMC && (
              <>
                {showOB && <Badge variant="outline" className="text-purple-500 border-purple-500/50">OB</Badge>}
                {showFVG && <Badge variant="outline" className="text-amber-500 border-amber-500/50">FVG</Badge>}
                {showLiquidity && <Badge variant="outline" className="text-cyan-500 border-cyan-500/50">Liq</Badge>}
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full bg-card/30">
            <CandlestickChart 
              symbol={symbol} 
              height={600} 
              indicators={indicators} 
              showVolume={showVolume}
              smcOverlays={getSMCOverlays()}
              candles={candles}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMC Signal Summary */}
      {smcSignal && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="text-xs text-muted-foreground uppercase">Signal</div>
                <div className={`text-2xl font-bold ${smcSignal.bias === 'bullish' ? 'text-green-500' : smcSignal.bias === 'bearish' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {smcSignal.bias.toUpperCase()}
                </div>
                <Badge variant="outline" className="mt-1">{smcSignal.confidence}%</Badge>
              </div>
              
              <Separator orientation="vertical" className="h-12" />
              
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Entry</div>
                  <div className="font-mono text-sm">{smcSignal.entryZone}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Stop Loss</div>
                  <div className="font-mono text-sm text-red-400">{smcSignal.stopLoss}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Target</div>
                  <div className="font-mono text-sm text-green-400">{smcSignal.target}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {smcSignal.reasons.map((reason, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{reason}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
