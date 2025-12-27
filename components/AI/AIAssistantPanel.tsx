
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Search, Trash2 } from "lucide-react";
import { Button, Input, Badge } from "../ui/primitives";
import { aiApi } from "../../api/aiApi";
import { AIChatMessage } from "../../services/aiAssistant";
import { cn } from "../ui/primitives";

export function AIAssistantPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    try {
        const saved = localStorage.getItem("apex-ai-chat-history");
        return saved ? JSON.parse(saved) : [{
            id: "init",
            role: "assistant",
            content: "Welcome to Apex Intelligence. I am powered by Gemini. Ask me about specific stocks, market patterns, or portfolio risk.",
            timestamp: Date.now()
        }];
    } catch (e) {
        return [];
    }
  });
  
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    localStorage.setItem("apex-ai-chat-history", JSON.stringify(messages));
  }, [messages]);

  const clearHistory = () => {
      setMessages([{
        id: "init-" + Date.now(),
        role: "assistant",
        content: "History cleared. How can I assist you?",
        timestamp: Date.now()
      }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    const res = await aiApi.chat(currentInput);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: res.data,
      timestamp: Date.now()
    }]);
    
    setIsTyping(false);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={onClose} />}
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 z-50 bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
                <h3 className="font-semibold text-sm">Apex AI</h3>
                <div className="flex items-center gap-1 text-xs text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={clearHistory}>
                <Trash2 className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col max-w-[90%]", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
              <div className={cn(
                "px-3 py-2 rounded-xl text-sm shadow-sm",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}>
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}
          {isTyping && <div className="text-xs text-muted-foreground animate-pulse">Gemini is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-background">
          <div className="relative flex items-center">
            <Input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask intelligence..." 
                className="pr-12"
            />
            <Button size="icon" variant="ghost" className="absolute right-1 h-8 w-8" onClick={handleSend}>
                <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
