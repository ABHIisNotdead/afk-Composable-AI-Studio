import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, MessageSquare, Sparkles } from 'lucide-react';

type Message = { role: 'user' | 'ai'; text: string; };

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (msg: string) => Promise<string | null>;
  className?: string;
};

export default function ChatPanel({ isOpen, onClose, onSendMessage, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    const response = await onSendMessage(userText);
    setMessages((prev) => [...prev, { role: 'ai', text: response || "Error: No response" }]);
    setLoading(false);
  };

  return (
    <div className={`bg-slate-900 flex flex-col border-t border-slate-800 ${className || 'w-full h-full'}`}>
      
      {/* Header */}
      <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900 shrink-0 select-none">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">Architect Consultant</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <Bot className="h-8 w-8 text-slate-800" />
            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">System Online</p>
            <p className="text-xs text-slate-500 px-6 italic">Ask me about your node logic or technical improvements.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-sm transition-all ${
              msg.role === 'user' 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
            }`}>
              {/* Architect Badge for AI messages */}
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-slate-700/50 opacity-70">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-tighter">AI Insight</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-indigo-400 px-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Analyzing Graph...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
        <div className="relative group">
            <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask Architect..." 
                className="w-full bg-slate-950 border border-slate-700 group-hover:border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-10" 
            />
            <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1.5 p-1 text-slate-500 hover:text-indigo-400 disabled:opacity-30 transition-colors"
            >
                <Send className="h-4 w-4" />
            </button>
        </div>
      </form>
    </div>
  );
}