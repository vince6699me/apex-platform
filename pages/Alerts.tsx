
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Switch, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/primitives";
import { alertService } from "../services/alertService";
import { Bell, Trash2, Plus, SlidersHorizontal } from "lucide-react";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [value, setValue] = useState("");
  const [condition, setCondition] = useState("price_above");

  useEffect(() => alertService.subscribe(setAlerts), []);

  const create = () => {
    if(value) {
        let msg = "";
        switch(condition) {
            case "price_above": msg = `Price above ${value}`; break;
            case "price_below": msg = `Price below ${value}`; break;
            case "rsi_above": msg = `RSI > ${value} (Overbought)`; break;
            case "rsi_below": msg = `RSI < ${value} (Oversold)`; break;
            case "ma_cross": msg = `Price crossed MA ${value}`; break;
        }
        
        alertService.createAlert({ 
            symbol: symbol.toUpperCase(), 
            type: condition.includes("rsi") ? "technical" : "price", 
            condition, 
            value: parseFloat(value), 
            message: msg, 
            isActive: true 
        });
        setValue("");
    }
  };

  const getConditionLabel = (c: string) => {
      switch(c) {
          case "price_above": return "Price Above";
          case "price_below": return "Price Below";
          case "rsi_above": return "RSI Above";
          case "rsi_below": return "RSI Below";
          case "ma_cross": return "Crosses MA";
          default: return c;
      }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
          <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
      </div>

      <Card className="bg-muted/30 border-dashed">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4"/> Create New Alert</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                    <div className="text-xs font-medium">Symbol</div>
                    <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. AAPL" className="uppercase" />
                </div>
                <div className="flex-1 space-y-2 w-full">
                    <div className="text-xs font-medium">Condition</div>
                    <Select value={condition} onValueChange={setCondition}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="price_above">Price Above</SelectItem>
                            <SelectItem value="price_below">Price Below</SelectItem>
                            <SelectItem value="rsi_above">RSI Above (Overbought)</SelectItem>
                            <SelectItem value="rsi_below">RSI Below (Oversold)</SelectItem>
                            <SelectItem value="ma_cross">Crosses Moving Average</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1 space-y-2 w-full">
                    <div className="text-xs font-medium">Threshold / Value</div>
                    <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 150" />
                </div>
                <Button onClick={create} className="w-full md:w-auto gap-2"><Bell className="h-4 w-4" /> Set Alert</Button>
            </div>
          </CardContent>
      </Card>

      <div className="grid gap-4">
        {alerts.length === 0 && <div className="text-center text-muted-foreground py-10 opacity-50">No active alerts configured.</div>}
        {alerts.map(alert => (
          <Card key={alert.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${alert.triggered ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                  <Bell className="h-5 w-5" />
              </div>
              <div>
                  <div className="font-bold flex items-center gap-2">
                      {alert.symbol}
                      <Badge variant="outline" className="text-[10px] font-normal">{getConditionLabel(alert.condition)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{alert.message}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={alert.triggered ? "destructive" : "default"} className={!alert.triggered ? "bg-green-500 hover:bg-green-600" : ""}>
                  {alert.triggered ? "Triggered" : "Active"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => alertService.deleteAlert(alert.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
