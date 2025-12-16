
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Sparkles, TrendingUp, AlertTriangle, Search, Activity, Trash2 } from "lucide-react";
import { Button, Input, Card, Badge } from "../ui/primitives";
import { AIAssistantService, AIChatMessage } from "../../services/aiAssistant";
import { cn } from "../ui/primitives";

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Separated MessageWidget for cleaner rendering logic
const MessageWidget = ({ msg }: { msg: AIChatMessage }) => {
  if (!msg.data) return null;

  switch (msg.type) {
    case "stock-analysis":
      const { quote, sentiment, rsi } = msg.data;
      return (
        <div className="mt-2 p-3 bg-card rounded-lg border border-border text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-lg">{msg.data.symbol}</span>
            <span className="font-mono">${quote.price.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex flex-col">
              <span>RSI</span>
              <span className={rsi > 70 ? "text-red-500" : rsi < 30 ? "text-green-500" : "text-foreground"}>{rsi.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span>Sentiment</span>
              <span className={sentiment.sentimentLabel === "Bullish" ? "text-green-500" : "text-red-500"}>{sentiment.sentimentLabel}</span>
            </div>
          </div>
        </div>
      );
    
    case "market-scan":
      return (
        <div className="mt-2 space-y-2">
           {msg.data.scans.slice(0, 3).map((s: any, i: number) => (
             <div key={i} className="p-2 bg-card rounded border flex justify-between items-center text-xs">
               <span className="font-bold">{s.symbol}</span>
               <Badge variant={s.direction === "Bullish" ? "default" : "destructive"}>{s.direction}</Badge>
             </div>
           ))}
           <Button size="sm" variant="ghost" className="w-full text-xs h-6">View All in Scanner</Button>
        </div>
      );

    case "risk-report":
       return (
           <div className="mt-2 p-3 bg-card rounded-lg border text-xs">
               <div className="flex justify-between mb-1"><span>VaR (95%)</span><span className="font-mono">${msg.data.valueAtRisk95.toLocaleString()}</span></div>
               <div className="flex justify-between mb-1"><span>Sharpe</span><span className="font-mono">{msg.data.sharpeRatio}</span></div>
               <div className="flex justify-between"><span>Max Drawdown</span><span className="text-red-500">{msg.data.maxDrawdownPercent}%</span></div>
           </div>
       );
       
    case "trading-insight":
        return (
            <div className="mt-2 p-3 bg-accent/20 rounded-lg border border-accent text-xs">
                <div className="font-semibold mb-1 text-primary">{msg.data.strategy}</div>
                <div className="grid grid-cols-2 gap-y-1">
                    <span>Timeframe: {msg.data.timeframe}</span>
                    <span>Win Rate: {msg.data.winRate}%</span>
                    <span>Profit Factor: {msg.data.profitFactor}</span>
                </div>
            </div>
        );

    default: return null;
  }
};

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  const [input, setInput] = useState("");
  // Initialize from LocalStorage or default
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    try {
        const saved = localStorage.getItem("apex-ai-chat-history");
        return saved ? JSON.parse(saved) : [{
            id: "init",
            role: "assistant",
            content: "Hello, Executive Trader. I'm Apex AI. I'm ready to analyze markets, scan for patterns, or assess risk for you.",
            timestamp: Date.now(),
            type: "text"
        }];
    } catch (e) {
        return [];
    }
  });
  
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, isOpen]);

  // Save to LocalStorage whenever messages update
  useEffect(() => {
    localStorage.setItem("apex-ai-chat-history", JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
      const initMsg: AIChatMessage = {
        id: "init-" + Date.now(),
        role: "assistant",
        content: "History cleared. How can I help you now?",
        timestamp: Date.now(),
        type: "text"
      };
      setMessages([initMsg]);
  };

  const processMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
      type: "text"
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await AIAssistantService.processMessage(userMsg.content);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "I encountered a system error processing that request.",
        timestamp: Date.now(),
        type: "text"
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => processMessage(input);
  
  const handleSearch = () => {
      if(!input) return;
      
      const upperInput = input.toUpperCase();
      
      // Enhanced Search Logic
      if (["RSI", "MACD", "SMA", "EMA", "BOL"].some(i => upperInput.includes(i))) {
          const indicator = upperInput.match(/(RSI|MACD|SMA|EMA|BOL)/)?.[0];
          processMessage(`Explain the ${indicator} indicator and show best settings for current volatility.`);
      } else if (upperInput.length <= 5 && /^[A-Z]+$/.test(upperInput)) {
          // Ticker check
          processMessage(`Analyze ${upperInput}`);
      } else {
          processMessage(input);
      }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={onClose} />}
      
      {/* Panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 z-50 bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg"><Bot className="h-5 w-5 text-primary" /></div>
            <div>
                <h3 className="font-semibold text-sm">Apex AI</h3>
                <div className="flex items-center gap-1 text-xs text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={clearHistory} title="Clear History">
                <Trash2 className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn(
                "px-3 py-2.5 rounded-2xl text-sm shadow-sm",
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-none" 
                  : "bg-muted text-foreground rounded-bl-none"
              )}>
                {msg.content}
              </div>
              <MessageWidget msg={msg} />
              <span className="text-xs text-muted-foreground mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
          {isTyping && (
             <div className="flex items-center gap-1 ml-1">
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="relative flex items-center">
            <Input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask or search symbol..." 
                className="pr-20"
            />
            <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={handleSearch}
                    title="Search/Analyze"
                >
                    <Search className="h-4 w-4" />
                </Button>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={handleSend}
                    title="Send Message"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
          </div>
          
          {/* Quick Commands */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
             {[
               { label: "Scan Markets", cmd: "Scan Markets" }, 
               { label: "Analyze AAPL", cmd: "Analyze AAPL" }, 
               { label: "Risk Check", cmd: "Risk Check" },
               { label: "Strategy", cmd: "Suggest Strategy" }
             ].map(item => (
                 <button 
                    key={item.label}
                    onClick={() => { setInput(item.cmd); }}
                    className="text-xs border border-input bg-card/50 rounded-full px-3 py-1.5 whitespace-nowrap hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 text-muted-foreground font-medium"
                 >
                    {item.label}
                 </button>
             ))}
          </div>
        </div>
      </div>
    </>
  );
}
