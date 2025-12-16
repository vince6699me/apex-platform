
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "../components/ui/primitives";
import { WatchlistTable } from "../components/Watchlist/WatchlistTable";
import { MarketNews } from "../components/Dashboard/MarketNews";
import { Wallet, TrendingUp, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Gauge, BarChart } from "lucide-react";
import { MarketDataService } from "../services/marketData";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';

function StatCard({ title, value, change, changeType, icon: Icon }: any) {
  return (
    <Card className="overflow-hidden bg-card/50 hover:bg-card/80 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight animate-fade-in key={value}">{value}</h3>
            {change && (
                <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                    {changeType === 'positive' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {change}
                </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SentimentGauge({ score }: { score: number }) {
    // Score -1 to 1
    const percentage = ((score + 1) / 2) * 100;
    const label = score > 0.3 ? "Bullish" : score < -0.3 ? "Bearish" : "Neutral";
    const color = score > 0.3 ? "text-green-500" : score < -0.3 ? "text-red-500" : "text-yellow-500";
    
    return (
        <div className="flex flex-col items-center justify-center py-2">
            <div className="relative h-24 w-48 overflow-hidden">
                 <div className="absolute top-0 left-0 h-full w-full rounded-t-full bg-secondary/30 border-8 border-secondary border-b-0"></div>
                 <div 
                    className="absolute top-0 left-0 h-full w-full rounded-t-full border-8 border-primary border-b-0 origin-bottom transition-all duration-1000 ease-out"
                    style={{ transform: `rotate(${percentage * 1.8 - 180}deg)`, opacity: 0.8 }}
                 ></div>
            </div>
            <div className={`mt-2 text-2xl font-bold ${color}`}>{label}</div>
            <div className="text-xs text-muted-foreground">Market Sentiment Score: {score.toFixed(2)}</div>
        </div>
    );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [marketSentiment, setMarketSentiment] = useState(0.25);

  // Initial Data
  useEffect(() => {
    const pos = MarketDataService.generatePositions();
    const calculate = () => {
        // Add some jitter to simulate live updates
        const jitter = 1 + (Math.random() * 0.002 - 0.001);
        const totalVal = pos.reduce((s, p) => s + p.value, 0) * jitter;
        const totalPnL = pos.reduce((s, p) => s + p.pnl, 0) * jitter;
        
        setMetrics({
            totalVal,
            totalPnL,
            totalPnLPercent: (totalPnL / (totalVal - totalPnL)) * 100,
            active: pos.length,
            riskScore: 92
        });
        
        setMarketSentiment(prev => {
            const next = prev + (Math.random() * 0.1 - 0.05);
            return Math.max(-1, Math.min(1, next));
        });
    };

    calculate();
    setPerformanceData(MarketDataService.generatePortfolioPerformance(30));
    
    const interval = setInterval(calculate, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <div className="space-y-6 p-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Badge variant="outline" className="gap-2 px-3 py-1"><Activity className="h-3 w-3 text-green-500 animate-pulse"/> System Online</Badge>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Portfolio Value" 
            value={`$${metrics.totalVal.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
            change={`${metrics.totalPnLPercent > 0 ? "+" : ""}${metrics.totalPnLPercent.toFixed(2)}%`} 
            changeType={metrics.totalPnL >= 0 ? "positive" : "negative"} 
            icon={Wallet} 
        />
        <StatCard 
            title="Total P&L" 
            value={`$${metrics.totalPnL.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
            change="All time" 
            changeType={metrics.totalPnL >= 0 ? "positive" : "negative"} 
            icon={TrendingUp} 
        />
        <StatCard 
            title="Market Sentiment" 
            value={(marketSentiment * 100).toFixed(0)} 
            change={marketSentiment > 0 ? "Bullish" : "Bearish"} 
            changeType={marketSentiment > 0 ? "positive" : "negative"} 
            icon={Gauge} 
        />
        <StatCard 
            title="Safety Score" 
            value={`${metrics.riskScore}/100`} 
            change="VaR: Low" 
            changeType="positive" 
            icon={AlertTriangle} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>Portfolio Performance</CardTitle>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="cursor-pointer">1D</Badge>
                    <Badge variant="default" className="cursor-pointer">1M</Badge>
                    <Badge variant="secondary" className="cursor-pointer">YTD</Badge>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment & News Side Panel */}
        <div className="space-y-6">
             <Card className="border-border/50">
                <CardHeader><CardTitle className="text-sm">Real-Time Sentiment</CardTitle></CardHeader>
                <CardContent>
                    <SentimentGauge score={marketSentiment} />
                </CardContent>
             </Card>
            
            <MarketNews />
        </div>
      </div>
      
      {/* Watchlist */}
      <WatchlistTable />
      
      {/* Recent Activity Mini-Widget */}
       <Card className="mt-6">
          <CardHeader className="py-4"><CardTitle className="text-sm text-muted-foreground">System Activity Log</CardTitle></CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-col md:flex-row gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Executed: BUY 50 AAPL @ 175.50</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Alert: TSLA RSI Oversold (28.5)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> AI: Pattern 'Double Bottom' detected on NVDA</span>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
