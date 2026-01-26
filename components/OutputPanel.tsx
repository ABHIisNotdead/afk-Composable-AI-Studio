import React, { useEffect, useRef } from 'react';
import { X, Terminal, Trash2 } from 'lucide-react';

type Log = { timestamp: string; type: 'info' | 'success' | 'error'; message: string; };
type OutputPanelProps = { isOpen: boolean; onClose: () => void; logs: Log[]; onClear: () => void; className?: string };

export default function OutputPanel({ isOpen, onClose, logs, onClear, className }: OutputPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`bg-slate-950 flex flex-col border-l border-slate-800 ${className || 'w-full h-full'}`}>
      
      {/* Header */}
      <div className="h-9 border-b border-slate-800 flex items-center justify-between px-3 bg-slate-900 shrink-0 select-none">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Console Output</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClear} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-colors" title="Clear">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5" ref={scrollRef}>
        {logs.length === 0 && <div className="text-slate-700 italic">Console ready...</div>}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2">
            <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
            <span className={`break-all ${
              log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {log.type === 'error' ? '❌ ' : log.type === 'success' ? '✅ ' : '> '}
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}