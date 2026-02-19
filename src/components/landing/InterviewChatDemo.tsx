import { useState, useEffect } from "react";

const chatMessages = [
  { role: "ai", text: "Design a system that can handle 10M daily active users. What's your first question?" },
  { role: "user", text: "What's the primary use case? Read-heavy or write-heavy?" },
  { role: "ai", text: "Great clarification! It's 80% reads, 20% writes. What architecture would you propose?" },
  { role: "user", text: "I'd use a read replica setup with caching layer..." },
  { role: "ai", text: "Good start. How would you handle cache invalidation?" },
];

export default function InterviewChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState(0);

  useEffect(() => {
    if (visibleMessages < chatMessages.length) {
      const timeout = setTimeout(() => {
        setVisibleMessages(v => v + 1);
      }, 1500);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setVisibleMessages(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [visibleMessages]);

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-sm">🤖</span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">System Design Interviewer</p>
          <p className="text-xs text-emerald-400">● Online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 space-y-3 min-h-[280px]">
        {chatMessages.slice(0, visibleMessages).map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {visibleMessages < chatMessages.length && visibleMessages > 0 && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
