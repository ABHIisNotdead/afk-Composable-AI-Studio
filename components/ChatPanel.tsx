import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, MessageSquare } from 'lucide-react';

type Message = { role: 'user' | 'ai'; text: string; };

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (msg: string) => Promise<string | null>;
  className?: string; // New prop to allow parent layout to control size
};

export default function ChatPanel({ isOpen, onClose, onSendMessage, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading]);

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
    // Default style is removed; we rely on 'className' or default to h-full
    <div className={`bg-slate-900 flex flex-col ${className || 'w-full h-full'}`}>
      
      {/* Header */}
      <div className="h-9 border-b border-slate-800 flex items-center justify-between px-3 bg-slate-900 shrink-0 select-none">
        <div className="flex items-center gap-2 text-slate-300">
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">Debug Chat</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-slate-600 mt-4 text-xs italic">
            Debug chat ready...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg px-2 py-1.5 text-xs ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-500 animate-pulse">Thinking...</div>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-800 bg-slate-900 shrink-0">
        <div className="relative">
            <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Send debug message..." 
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8" 
            />
            <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="absolute right-1 top-1 p-0.5 text-slate-400 hover:text-white disabled:opacity-50"
            >
                <Send className="h-3.5 w-3.5" />
            </button>
        </div>
      </form>
    </div>
  );
}