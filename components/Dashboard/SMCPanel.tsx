/**
 * SMC (Smart Money Concepts) Dashboard Panel
 * 
 * Displays real-time SMC analysis including:
 * - Current market structure (BOS/CHOCH)
 * - Order blocks
 * - Fair value gaps
 * - Liquidity zones
 * - Premium/Discount positioning
 * - Kill zone timing
 * - Trade setups
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "../../components/ui/primitives";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Zap, 
  AlertTriangle, 
  ChevronRight, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity
} from "lucide-react";
import { 
  getActiveKillZone, 
  getTimeUntilZone, 
  getCurrentBestPairs,
  formatSchedule 
} from "../../services/killZoneService";
import { 
  detectOrderBlocks, 
  detectFVGs, 
  detectBOS, 
  detectCHOCH,
  calculatePremiumDiscount,
  runSMCAnalysis 
} from "../../services/smcIndicators";
import { 
  OHLCV, 
  OrderBlock, 
  FairValueGap, 
  BreakOfStructure,
  ChangeOfCharacter,
  KillZone,
  SMCAnalysis 
} from "../../types";
import { MarketDataService } from "../../services/marketData";

// ============================================================================
// SMC STATUS BADGES
// ============================================================================

function StructureBadge({ trend, confidence }: { trend: string; confidence: number }) {
  const colors: Record<string, string> = {
    Bullish: "bg-green-500/20 text-green-400 border-green-500/30",
    Bearish: "bg-red-500/20 text-red-400 border-red-500/30",
    Neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30"
  };
  
  return (
    <Badge className={`${colors[trend] || colors.Neutral} border px-2 py-1`}>
      {trend} ({confidence}%)
    </Badge>
  );
}

function KillZoneBadge({ zone }: { zone: KillZone | null }) {
  if (!zone) {
    return (
      <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
        Off Hours
      </Badge>
    );
  }
  
  const colors: Record<string, string> = {
    "Asian Kill Zone": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "London Kill Zone": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "London Open Kill Zone": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "New York Kill Zone": "bg-green-500/20 text-green-400 border-green-500/30",
    "London Close Kill Zone": "bg-orange-500/20 text-orange-400 border-orange-500/30"
  };
  
  return (
    <Badge className={`${colors[zone.name] || "bg-gray-500/20"} border px-2 py-1`}>
      <Clock className="h-3 w-3 mr-1" />
      {zone.name}
    </Badge>
  );
}

// ============================================================================
// ORDER BLOCK CARD
// ============================================================================

function OrderBlockItem({ ob }: { ob: OrderBlock }) {
  const isBullish = ob.type === "Bullish";
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isBullish ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {isBullish ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{ob.type} OB</span>
            <Badge variant="outline" className="text-xs">{ob.quality}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {ob.high.toFixed(2)} - {ob.low.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`text-xs ${ob.discountPremium === 'Discount' ? 'text-green-400' : ob.discountPremium === 'Premium' ? 'text-red-400' : 'text-gray-400'}`}>
          {ob.discountPremium}
        </Badge>
      </div>
    </div>
  );
}

// ============================================================================
// FVG CARD
// ============================================================================

function FVGItem({ fvg }: { fvg: FairValueGap }) {
  const isBullish = fvg.type === "Bullish";
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isBullish ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <Target className="h-4 w-4 text-yellow-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{fvg.type} FVG</span>
            <Badge variant="outline" className="text-xs">{fvg.strength}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Size: {fvg.size.toFixed(2)} | {fvg.mitigated ? "Filled" : "Open"}
          </div>
        </div>
      </div>
      <div className="text-xs font-mono">
        {fvg.priceLevel.toFixed(2)}
      </div>
    </div>
  );
}

// ============================================================================
// KILL ZONE CARD
// ============================================================================

function KillZoneCard() {
  const [timeInfo, setTimeInfo] = useState(getTimeUntilZone());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getTimeUntilZone());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const activeZone = getActiveKillZone();
  const bestPairs = getCurrentBestPairs();
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Kill Zone Timer
          </CardTitle>
          <KillZoneBadge zone={activeZone.zone} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeZone.isActive ? (
          <>
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-3xl font-bold text-primary">{timeInfo.text}</div>
              <div className="text-sm text-muted-foreground">remaining in zone</div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">BEST PAIRS NOW</div>
              <div className="flex flex-wrap gap-2">
                {bestPairs.slice(0, 4).map(pair => (
                  <Badge key={pair} variant="secondary" className="bg-primary/10">
                    {pair}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-4 rounded-lg bg-card/50">
            <div className="text-sm text-muted-foreground mb-2">Next kill zone</div>
            <div className="text-lg font-bold">{timeInfo.zone}</div>
            <div className="text-sm text-primary">{timeInfo.text}</div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          Trading during kill zones increases probability
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PREMIUM/DISCOUNT CARD
// ============================================================================

function PremiumDiscountCard({ position, percentage, description }: { 
  position: string; 
  percentage: number;
  description: string;
}) {
  const colors: Record<string, string> = {
    Discount: "from-green-500/20 to-transparent",
    Premium: "from-red-500/20 to-transparent",
    Equilibrium: "from-gray-500/20 to-transparent"
  };
  
  return (
    <Card className={`bg-gradient-to-b ${colors[position] || colors.Equilibrium} border-border/50`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {position === "Discount" ? (
            <ArrowUpRight className="h-4 w-4 text-green-400" />
          ) : position === "Premium" ? (
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          ) : (
            <Activity className="h-4 w-4 text-gray-400" />
          )}
          Premium / Discount
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${
            position === "Discount" ? "bg-green-500/20 text-green-400" :
            position === "Premium" ? "bg-red-500/20 text-red-400" :
            "bg-gray-500/20 text-gray-400"
          } border-0`}>
            {position}
          </Badge>
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TRADE SETUP CARD
// ============================================================================

function TradeSetupItem({ setup, onClick }: { 
  setup: {
    direction: string;
    confidence: number;
    entryPrice: number;
    stopLoss: number;
    takeProfits: number[];
    killZone: string;
  };
  onClick: () => void;
}) {
  const isBullish = setup.direction === "Bullish";
  const rr = setup.takeProfits[0] > setup.entryPrice 
    ? (setup.takeProfits[0] - setup.entryPrice) / (setup.entryPrice - setup.stopLoss)
    : (setup.entryPrice - setup.takeProfits[0]) / (setup.stopLoss - setup.entryPrice);
  
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isBullish ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {isBullish ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{setup.direction}</span>
            <Badge variant="outline" className="text-xs">{setup.confidence}%</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Entry: {setup.entryPrice.toFixed(2)} | SL: {setup.stopLoss.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className="bg-primary/20 text-primary border-0">
          1:{rr.toFixed(1)} R:R
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SMC PANEL
// ============================================================================

interface SMCPanelProps {
  symbol?: string;
  onSetupClick?: (setup: any) => void;
}

export function SMCPanel({ symbol = "AAPL", onSetupClick }: SMCPanelProps) {
  const [loading, setLoading] = useState(true);
  const [smcAnalysis, setSMCAnalysis] = useState<SMCAnalysis | null>(null);
  const [tradeSetups, setTradeSetups] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchSMCData = async () => {
      setLoading(true);
      try {
        const history = await MarketDataService.getHistoryFromPolygon(symbol);
        const quote = await MarketDataService.getQuoteFromAlphaVantage(symbol);
        const analysis = runSMCAnalysis(history, quote.price);
        
        // Generate trade setups
        const setups: any[] = [];
        
        // Bullish OB setup
        const bullishOBs = analysis.orderBlocks.filter(ob => ob.type === "Bullish" && ob.quality !== "Low");
        bullishOBs.slice(0, 2).forEach(ob => {
          const entry = ob.high - (ob.high - ob.low) * 0.3;
          const stop = ob.low - (ob.high - ob.low) * 0.5;
          const risk = Math.abs(entry - stop);
          
          setups.push({
            direction: "Bullish",
            confidence: ob.quality === "High" ? 85 : 70,
            entryPrice: entry,
            stopLoss: stop,
            takeProfits: [entry + risk * 2, entry + risk * 3],
            killZone: getActiveKillZone().zone?.name || "None"
          });
        });
        
        // Bearish OB setup
        const bearishOBs = analysis.orderBlocks.filter(ob => ob.type === "Bearish" && ob.quality !== "Low");
        bearishOBs.slice(0, 2).forEach(ob => {
          const entry = ob.low + (ob.high - ob.low) * 0.3;
          const stop = ob.high + (ob.high - ob.low) * 0.5;
          const risk = Math.abs(stop - entry);
          
          setups.push({
            direction: "Bearish",
            confidence: ob.quality === "High" ? 85 : 70,
            entryPrice: entry,
            stopLoss: stop,
            takeProfits: [entry - risk * 2, entry - risk * 3],
            killZone: getActiveKillZone().zone?.name || "None"
          });
        });
        
        setSMCAnalysis(analysis);
        setTradeSetups(setups);
      } catch (error) {
        console.error("SMC analysis failed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSMCData();
    const interval = setInterval(fetchSMCData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            SMC Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* SMC Overview Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              SMC Analysis - {symbol}
            </CardTitle>
            <div className="flex items-center gap-2">
              {smcAnalysis?.currentBias && (
                <StructureBadge 
                  trend={smcAnalysis.currentBias} 
                  confidence={smcAnalysis.trendStrength} 
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Current Bias */}
            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1">Market Bias</div>
              <div className="flex items-center gap-2">
                {smcAnalysis?.currentBias === "Bullish" ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : smcAnalysis?.currentBias === "Bearish" ? (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                ) : (
                  <Activity className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-xl font-bold">{smcAnalysis?.currentBias || "Neutral"}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Strength: {smcAnalysis?.trendStrength || 0}%
              </div>
            </div>
            
            {/* Order Blocks */}
            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1">Order Blocks</div>
              <div className="text-xl font-bold">
                {smcAnalysis?.orderBlocks.length || 0} detected
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {smcAnalysis?.orderBlocks.filter(ob => ob.quality === "High").length || 0} high quality
              </div>
            </div>
            
            {/* FVGs */}
            <div className="p-4 rounded-lg bg-card/50 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1">Fair Value Gaps</div>
              <div className="text-xl font-bold">
                {smcAnalysis?.fairValueGaps.length || 0} detected
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {smcAnalysis?.fairValueGaps.filter(f => !f.mitigated).length || 0} unfilled
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Kill Zone & Premium/Discount */}
      <div className="grid gap-6 lg:grid-cols-2">
        <KillZoneCard />
        
        {smcAnalysis?.premiumDiscount && (
          <PremiumDiscountCard 
            position={smcAnalysis.premiumDiscount.position}
            percentage={smcAnalysis.premiumDiscount.percentage}
            description={smcAnalysis.premiumDiscount.description}
          />
        )}
      </div>
      
      {/* Order Blocks */}
      {smcAnalysis && smcAnalysis.orderBlocks.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Order Blocks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {smcAnalysis.orderBlocks.slice(0, 4).map((ob, i) => (
              <OrderBlockItem key={i} ob={ob} />
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Fair Value Gaps */}
      {smcAnalysis && smcAnalysis.fairValueGaps.filter(f => !f.mitigated).length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Active Fair Value Gaps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {smcAnalysis.fairValueGaps.filter(f => !f.mitigated).slice(0, 4).map((fvg, i) => (
              <FVGItem key={i} fvg={fvg} />
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Trade Setups */}
      {tradeSetups.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              Trade Setups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tradeSetups.map((setup, i) => (
              <TradeSetupItem 
                key={i} 
                setup={setup} 
                onClick={() => onSetupClick?.(setup)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default SMCPanel;
