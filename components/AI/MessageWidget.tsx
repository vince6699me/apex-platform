
import React from "react";
import { AIChatMessage } from "../../services/aiAssistant";
import { cn } from "../ui/primitives";

interface MessageWidgetProps {
  msg: AIChatMessage;
  key?: React.Key;
}

export function MessageWidget({ msg }: MessageWidgetProps) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex flex-col max-w-[90%]", isUser ? "ml-auto items-end" : "mr-auto items-start")}>
      <div className={cn(
        "px-3 py-2 rounded-xl text-sm shadow-sm",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      )}>
        {msg.content}
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
