import { useState, useEffect } from "react";

const terminalLines = [
  { type: "prompt", text: "studymate > " },
  { type: "command", text: "start interview --role=backend" },
  { type: "output", text: "" },
  { type: "ai", text: "🤖 AI Interviewer: Design a URL shortener. Where would you start?" },
  { type: "output", text: "" },
  { type: "user", text: "▸ I'd clarify requirements first..." },
  { type: "output", text: "" },
  { type: "ai", text: "🤖 Good. What's the expected scale?" },
  { type: "output", text: "" },
  { type: "success", text: "✓ +10 Clarification Habit Score" },
];

export default function TerminalDemo() {
  const [displayedLines, setDisplayedLines] = useState<typeof terminalLines>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (currentLine >= terminalLines.length) {
      // Reset after delay
      const timeout = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLine(0);
        setCurrentChar(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const line = terminalLines[currentLine];
    
    if (currentChar < line.text.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          if (newLines.length <= currentLine) {
            newLines.push({ ...line, text: "" });
          }
          newLines[currentLine] = { ...line, text: line.text.slice(0, currentChar + 1) };
          return newLines;
        });
        setCurrentChar(c => c + 1);
      }, line.type === "command" ? 50 : 25);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, line.type === "ai" ? 800 : 300);
      return () => clearTimeout(timeout);
    }
  }, [currentLine, currentChar]);

  const getLineClass = (type: string) => {
    switch (type) {
      case "prompt": return "text-emerald-400";
      case "command": return "text-white";
      case "ai": return "text-blue-400";
      case "user": return "text-amber-300";
      case "success": return "text-emerald-400 font-bold";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900">
      {/* Mac Window Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" />
        <div className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-400 transition-colors" />
        <div className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors" />
        <span className="ml-4 text-xs text-slate-400 font-mono">studymate — zsh</span>
      </div>
      
      {/* Terminal Content */}
      <div className="p-5 font-mono text-sm leading-relaxed min-h-[280px]">
        {displayedLines.map((line, i) => (
          <div key={i} className={`${getLineClass(line.type)} ${line.text === "" ? "h-4" : ""}`}>
            {line.type === "prompt" && <span className="text-emerald-400">{line.text}</span>}
            {line.type !== "prompt" && line.text}
            {i === displayedLines.length - 1 && currentLine < terminalLines.length && (
              <span className="inline-block w-2 h-4 bg-white/80 ml-0.5 animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
