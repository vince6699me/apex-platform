
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Separator, Switch } from "../components/ui/primitives";
import { CandlestickChart, IndicatorConfig } from "../components/Charts/CandlestickChart";
import { Settings2, Plus, Trash2, Save, Zap, Eye, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function Charts() {
  const [symbol, setSymbol] = useState("AAPL");
  const [showVolume, setShowVolume] = useState(true);
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([]);
  
  // Configuration State for New Indicator
  const [newType, setNewType] = useState("SMA");
  const [newPeriod, setNewPeriod] = useState("20");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newSource, setNewSource] = useState<"close" | "open" | "high" | "low">("close");
  const [newStdDev, setNewStdDev] = useState("2");
  const [newFastPeriod, setNewFastPeriod] = useState("12");
  const [newSlowPeriod, setNewSlowPeriod] = useState("26");
  const [newSignalPeriod, setNewSignalPeriod] = useState("9");

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("apexChartConfig");
    if (savedConfig) {
        try {
            const parsed = JSON.parse(savedConfig);
            if (parsed.indicators) setIndicators(parsed.indicators);
            if (parsed.symbol) setSymbol(parsed.symbol);
            if (parsed.showVolume !== undefined) setShowVolume(parsed.showVolume);
        } catch (e) {
            console.error("Failed to load chart config", e);
            loadDefaults();
        }
    } else {
        loadDefaults();
    }
  }, []);

  const loadDefaults = () => {
    setIndicators([
        { id: '1', type: 'SMA', period: 50, color: '#3b82f6', lineWidth: 2, source: 'close' },
        { id: '2', type: 'EMA', period: 20, color: '#eab308', lineWidth: 2, source: 'close' }
    ]);
  };

  const saveConfiguration = () => {
      const config = { symbol, indicators, showVolume };
      localStorage.setItem("apexChartConfig", JSON.stringify(config));
      toast.success("Configuration Saved", { description: "Your chart settings and indicators have been saved." });
  };

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
          // SMA, EMA, RSI
          newInd.period = parseInt(newPeriod);
      }
      
      setIndicators([...indicators, newInd]);
      toast.success(`Added ${newType}`, { description: `Added ${newType} indicator to the chart.` });
  };

  const removeIndicator = (id: string) => {
      setIndicators(indicators.filter(i => i.id !== id));
  };

  const applyPreset = (preset: string) => {
      const genId = () => Math.random().toString(36).substr(2, 9);
      
      if (preset === 'MACD + RSI') {
          setIndicators([
              { id: genId(), type: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#22c55e', lineWidth: 1, source: 'close' },
              { id: genId(), type: 'RSI', period: 14, color: '#8b5cf6', lineWidth: 2, source: 'close' }
          ]);
      } else if (preset === 'BB + SMA50') {
           setIndicators([
              { id: genId(), type: 'BB', period: 20, stdDev: 2, color: '#3b82f6', lineWidth: 1, source: 'close' },
              { id: genId(), type: 'SMA', period: 50, color: '#eab308', lineWidth: 2, source: 'close' }
          ]);
      } else if (preset === 'Golden Cross') {
          setIndicators([
              { id: genId(), type: 'SMA', period: 50, color: '#eab308', lineWidth: 2, source: 'close' },
              { id: genId(), type: 'SMA', period: 200, color: '#3b82f6', lineWidth: 3, source: 'close' }
          ]);
      }
      toast.success("Preset Applied", { description: `${preset} configuration loaded.` });
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Advanced Charts</h1>
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-card border rounded-md px-3 py-1.5 shadow-sm">
                <Switch id="vol-toggle" checked={showVolume} onCheckedChange={setShowVolume} />
                <Label htmlFor="vol-toggle" className="text-xs font-medium cursor-pointer flex items-center gap-1">
                    {showVolume ? <Eye className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>} Volume
                </Label>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2"><Settings2 className="h-4 w-4"/> Indicators</Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Configure Indicators</DialogTitle></DialogHeader>
                    <div className="space-y-6">
                        {/* Presets */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Quick Presets</h4>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs" onClick={() => applyPreset('MACD + RSI')}><Zap className="h-3 w-3"/> MACD + RSI</Button>
                                <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs" onClick={() => applyPreset('BB + SMA50')}><Zap className="h-3 w-3"/> BB + SMA50</Button>
                                <Button variant="secondary" size="sm" className="gap-1 h-8 text-xs" onClick={() => applyPreset('Golden Cross')}><Zap className="h-3 w-3"/> Golden Cross</Button>
                                <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs ml-auto text-muted-foreground" onClick={loadDefaults}><RotateCcw className="h-3 w-3"/> Reset</Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Add New */}
                        <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                            <h4 className="font-medium text-sm">Add Custom Indicator</h4>
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
                            
                            {/* Dynamic Inputs based on type */}
                            <div className="grid grid-cols-3 gap-3">
                                {/* Common Source Input */}
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
                            
                            <Button onClick={addIndicator} className="w-full gap-2 h-8"><Plus className="h-4 w-4"/> Add Indicator</Button>
                        </div>
                        
                        {/* Active List */}
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Active Indicators</h4>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                {indicators.length === 0 && <p className="text-sm text-muted-foreground italic">No indicators active.</p>}
                                {indicators.map(ind => (
                                    <div key={ind.id} className="flex items-center justify-between p-2 border rounded-md bg-card shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ind.color }}></div>
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
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeIndicator(ind.id)}>
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

            <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Symbol" /></SelectTrigger>
                <SelectContent>
                    {["AAPL", "TSLA", "MSFT", "NVDA", "GOOGL"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>
      <Card>
        <CardHeader className="py-4"><CardTitle className="text-sm font-medium text-muted-foreground">{symbol} - 1 Day</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full bg-card/30">
            <CandlestickChart symbol={symbol} height={600} indicators={indicators} showVolume={showVolume} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
