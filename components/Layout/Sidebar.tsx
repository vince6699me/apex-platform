
import React from 'react';
import { NavLink, useLocation } from "react-router-dom";
import { cn, Button, Tooltip, TooltipTrigger, TooltipContent } from "../ui/primitives";
import { LayoutDashboard, TrendingUp, Wallet, ListTodo, LineChart, Brain, Settings, BarChart3, Bell, Radar, ChevronLeft, Menu } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Portfolio", href: "/portfolio", icon: Wallet },
  { name: "Watchlist", href: "/watchlist", icon: ListTodo },
  { name: "Technical Analysis", href: "/technical-analysis", icon: TrendingUp },
  { name: "Charts", href: "/charts", icon: LineChart },
  { name: "Risk Management", href: "/risk", icon: BarChart3 },
  { name: "AI Intelligence", href: "/ai", icon: Brain },
  { name: "Trading Intelligence", href: "/trading-intelligence", icon: Radar },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

export function Sidebar({ isOpen, toggle }: SidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex h-screen flex-col border-r border-border/60 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out relative z-30", isOpen ? "w-64" : "w-20")}>
      
      {/* Header */}
      <div className={cn("flex h-20 items-center border-b border-border/50 transition-all duration-300", isOpen ? "px-6 justify-between" : "justify-center px-2")}>
        {isOpen ? (
            <>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-[var(--shadow-glow-primary)]">
                        <TrendingUp className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="whitespace-nowrap">
                        <span className="block text-lg font-semibold leading-none tracking-wide text-gradient-primary">Apex</span>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Platform</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </>
        ) : (
             <Button variant="ghost" size="icon" onClick={toggle} className="h-10 w-10 text-muted-foreground hover:text-primary">
                <Menu className="h-5 w-5" />
             </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-hide">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const LinkContent = (
            <NavLink key={item.name} to={item.href} className={cn("group flex items-center rounded-2xl transition-all duration-200", 
                isOpen ? "gap-3 px-3 py-2.5" : "justify-center p-2.5 h-12 w-12 mx-auto",
                isActive ? "bg-gradient-to-r from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-lg shadow-primary/40" : "text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] hover:shadow-md"
            )}>
              <item.icon className={cn("transition-transform duration-200 shrink-0", isOpen ? "h-5 w-5 group-hover:scale-110" : "h-6 w-6 group-hover:scale-110")} />
              {isOpen && <span className="text-sm font-semibold whitespace-nowrap">{item.name}</span>}
            </NavLink>
          );

          if (!isOpen) {
              return (
                  <Tooltip key={item.name} delayDuration={0}>
                      <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold">{item.name}</TooltipContent>
                  </Tooltip>
              )
          }

          return LinkContent;
        })}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-border/50 p-4 transition-all duration-300", isOpen ? "" : "p-2")}>
        <div className={cn("flex items-center gap-3 rounded-2xl bg-gradient-to-br from-secondary to-secondary/60 shadow-inner overflow-hidden", isOpen ? "p-3" : "p-0 justify-center h-12 w-12 mx-auto bg-none shadow-none")}>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/90 text-base font-semibold text-primary-foreground", !isOpen && "h-10 w-10")}>AC</div>
          {isOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">Executive</p>
                <p className="truncate text-xs text-muted-foreground">Apex Elite</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
