import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, Trash2, FileText, ImageIcon, Box, Download } from 'lucide-react';

type Log = { timestamp: string; type: 'info' | 'success' | 'error'; message: string; };
type OutputPanelProps = { 
  isOpen: boolean; 
  onClose: () => void; 
  logs: Log[]; 
  onClear: () => void; 
  className?: string;
  // NEW PROPS FOR TABS
  textOutput?: string;
  imageOutputs?: string[];
  onApprove?: () => void;
  hasFiles?: boolean;
};

export default function OutputPanel({ 
  isOpen, onClose, logs, onClear, className, 
  textOutput, imageOutputs = [], onApprove, hasFiles 
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'docs' | 'assets'>('console');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && activeTab === 'console') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className={`bg-slate-950 flex flex-col border-l border-slate-800 ${className || 'w-full h-full'}`}>
      
      {/* Tab Navigation */}
      <div className="h-10 border-b border-slate-800 flex items-center justify-between px-3 bg-slate-900 shrink-0">
        <div className="flex gap-1 h-full pt-1">
          {[
            { id: 'console', label: 'Console', icon: Terminal },
            { id: 'docs', label: 'Docs', icon: FileText },
            { id: 'assets', label: 'Assets', icon: ImageIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-wider transition-all border-t-2 ${
                activeTab === tab.id 
                ? 'border-indigo-500 bg-slate-950 text-white' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="h-3 w-3" /> {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={onClear} className="p-1 hover:bg-slate-800 rounded text-slate-500 transition-colors" title="Clear">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-500 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* 1. CONSOLE TAB */}
        {activeTab === 'console' && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1.5" ref={scrollRef}>
            {logs.length === 0 && <div className="text-slate-700 italic">Console ready...</div>}
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 hover:bg-white/5 p-0.5 rounded px-2">
                <span className="text-slate-600 shrink-0 select-none">{log.timestamp}</span>
                <span className={`break-all ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {log.type === 'error' ? '❌ ' : log.type === 'success' ? '✅ ' : '> '}
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 2. DOCS TAB (With Approval Logic) */}
        {activeTab === 'docs' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 prose prose-invert max-w-none prose-xs text-slate-300">
              {textOutput || <div className="text-slate-600 italic">No documentation generated yet. Run the app to see technical specs.</div>}
            </div>
            
            {/* ACTION BAR: Visible only if we have a preview ready to approve */}
            {hasFiles && (
              <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Prototype Ready</div>
                <button 
                  onClick={onApprove}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Box className="h-3 w-3" /> Approve & Generate IDE Scaffold
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. ASSETS TAB */}
        {activeTab === 'assets' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {imageOutputs.map((img, i) => (
                <div key={i} className="group relative aspect-square bg-slate-900 rounded border border-slate-800 overflow-hidden">
                  <img src={img} className="object-cover w-full h-full" alt="AI Asset" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => window.open(img)} className="p-2 bg-slate-800 rounded-full text-white"><Download size={14}/></button>
                  </div>
                </div>
              ))}
              {imageOutputs.length === 0 && <div className="text-slate-600 italic text-xs col-span-full">No image assets generated.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}