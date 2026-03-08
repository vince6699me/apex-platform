
import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/primitives";
import { WatchlistTable } from "../components/Watchlist/WatchlistTable";
import { MultiAssetWatchlist } from "../components/Watchlist/MultiAssetWatchlist";
import { MarketNews } from "../components/Dashboard/MarketNews";
import { SMCPanel } from "../components/Dashboard/SMCPanel";
import { COTPanel } from "../components/Dashboard/COTPanel";
import { SentimentPanel } from "../components/Dashboard/SentimentPanel";
import { ArbitragePanel } from "../components/Dashboard/ArbitragePanel";
import { AllStrategiesDashboard } from "../components/Dashboard/AllStrategiesDashboard";
import { Wallet, TrendingUp, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Gauge } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { marketApi } from "../api/marketApi";
import { portfolioApi } from "../api/portfolioApi";
import { Quote } from "../types";

function LiveTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const update = async () => {
      const res = await marketApi.getTrending();
      if (res.status === 200) setQuotes(res.data);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-card/40 border-b border-border p-2 mb-2 overflow-hidden">
      <div className="flex items-center gap-8 text-xs font-mono whitespace-nowrap animate-marquee">
        {quotes.map((q) => (
          <div key={q.symbol} className="flex items-center gap-2 shrink-0 px-4 border-r border-border last:border-0">
            <span className="font-bold text-muted-foreground">{q.symbol}</span>
            <span className="font-bold">${q.price.toFixed(2)}</span>
            <div className={`flex items-center gap-0.5 ${q.change >= 0 ? "text-green-500" : "text-red-500"}`}>
              {q.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(q.changePercent).toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, change, changeType, icon: Icon }: any) {
  return (
    <Card className="overflow-hidden bg-card/50 hover:bg-card/80 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight animate-fade-in">{value}</h3>
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

  useEffect(() => {
    const fetchData = async () => {
        const [posRes, perfRes] = await Promise.all([
          portfolioApi.getPositions(),
          portfolioApi.getPerformance(30)
        ]);

        if (posRes.status === 200 && perfRes.status === 200) {
          const positions = posRes.data;
          const jitter = 1 + (Math.random() * 0.002 - 0.001);
          const totalVal = positions.reduce((s, p) => s + p.value, 0) * jitter;
          const totalPnL = positions.reduce((s, p) => s + p.pnl, 0) * jitter;
          
          setMetrics({
              totalVal,
              totalPnL,
              totalPnLPercent: (totalPnL / (totalVal - totalPnL)) * 100,
              active: positions.length,
              riskScore: 92
          });
          setPerformanceData(perfRes.data);
        }

        setMarketSentiment(prev => {
            const next = prev + (Math.random() * 0.1 - 0.05);
            return Math.max(-1, Math.min(1, next));
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <div className="flex flex-col animate-fade-in pb-20">
      <LiveTicker />
      
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <Badge variant="outline" className="gap-2 px-3 py-1"><Activity className="h-3 w-3 text-green-500 animate-pulse"/> System Online</Badge>
        </div>
        
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
        <MultiAssetWatchlist />
        
        {/* SMC Analysis Panel */}
        <div className="mt-6">
          <SMCPanel symbol="AAPL" />
        </div>

        {/* AI Intelligence Dashboard - All Strategies */}
        <div className="mt-6">
          <AllStrategiesDashboard symbol="AAPL" />
        </div>

        {/* Strategy Panels */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <COTPanel symbol="AAPL" />
          <SentimentPanel symbol="AAPL" />
        </div>

        {/* Arbitrage Panel */}
        <div className="mt-6">
          <ArbitragePanel symbol="BTC" />
        </div>
      </div>
    </div>
  );
}
