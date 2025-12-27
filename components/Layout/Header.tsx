
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Activity, Clock, Bot } from "lucide-react";
import { Input, Button, Badge, Tooltip, TooltipContent, TooltipTrigger } from "../ui/primitives";
import { MarketDataService } from "../../services/marketData";
import { WatchlistItem } from "../../types";

function MarketStatusBar() {
  const [status, setStatus] = useState<'open' | 'closed' | 'pre-market' | 'after-hours'>('open');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusInfo = status === 'open' ? { label: 'Market Open', variant: 'default', icon: Activity } : { label: 'Closed', variant: 'outline', icon: Clock };
  const StatusIcon = statusInfo.icon;

  return (
    <div className="flex items-center gap-3 text-sm shrink-0">
      <Badge variant={statusInfo.variant as any} className="gap-1.5"><StatusIcon className="h-3 w-3" />{statusInfo.label}</Badge>
      <span className="text-muted-foreground hidden lg:inline">{time.toLocaleTimeString()}</span>
    </div>
  );
}

interface HeaderProps {
    onToggleAI?: () => void;
}

export function Header({ onToggleAI }: HeaderProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<WatchlistItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 0) {
      setSuggestions(MarketDataService.searchSymbols(val));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 relative z-40">
      <div className="flex flex-1 items-center gap-4">
        {/* Search */}
        <div className="relative w-72 lg:w-96" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search symbols..." 
            className="pl-10" 
            value={query}
            onChange={handleSearch}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
          />
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg py-2 z-50">
               {suggestions.map(item => (
                 <div key={item.symbol} className="px-4 py-2 hover:bg-accent cursor-pointer flex justify-between items-center group">
                    <div>
                        <div className="font-bold text-sm">{item.symbol}</div>
                        <div className="text-xs text-muted-foreground">{item.name}</div>
                    </div>
                    <div className="text-right">
                        <div className="font-mono text-sm">${item.price.toFixed(2)}</div>
                        <div className={`text-xs ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {item.changePercent.toFixed(2)}%
                        </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <MarketStatusBar />
        
        <div className="h-6 w-[1px] bg-border mx-2" />
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
                    onClick={onToggleAI}
                >
                    <Bot className="h-4 w-4" />
                    AI Agent
                </Button>
            </TooltipTrigger>
            <TooltipContent>Open AI Assistant</TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]">3</Badge>
        </Button>
      </div>
    </header>
  );
}
