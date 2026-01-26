// src/components/Sidebar.tsx
import React from 'react';
import {
  Bot,
  FileText,
  Database,
  Layout,
  LogIn,
  Grid,
  PanelBottom,
  Webhook,
  ShieldCheck,
  Code2,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ savedComponents }: { savedComponents?: any[] }) {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, prompt: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    // Passing a default prompt helps the Editor initialize the node data correctly
    event.dataTransfer.setData('application/prompt', prompt);
    event.dataTransfer.effectAllowed = 'move';
  };

  const DraggableItem = ({ type, label, icon: Icon, color, prompt }: any) => (
    <div
      className={`bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-grab hover:border-${color}-500 transition-all hover:translate-x-1 flex items-center gap-3 text-slate-200 hover:text-white group`}
      onDragStart={(event) => onDragStart(event, type, label, prompt)}
      draggable
    >
      <div className={`p-1.5 rounded-md bg-${color}-500/10 group-hover:bg-${color}-500/20 text-${color}-400`}>
        <Icon size={16} />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );

  return (
    <aside className="h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

        {/* SECTION 1: CORE */}
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Blocks</h3>
          <div className="space-y-2">
            <DraggableItem type="start" label="App Start" icon={Bot} color="emerald" prompt="Initialize Application" />
            <DraggableItem type="prog-lang" label="Tech Stack" icon={Code2} color="orange" prompt="React + Tailwind" />
            <DraggableItem type="database" label="Database" icon={Database} color="cyan" prompt="Supabase / LocalStorage" />
          </div>
        </div>

        {/* SECTION 2: UI COMPONENTS */}
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">UI Components</h3>
          <div className="space-y-2">
            <DraggableItem type="ui-component" label="Hero Section" icon={Layout} color="indigo" prompt="Modern Hero with CTA" />
            <DraggableItem type="ui-component" label="Login Form" icon={LogIn} color="indigo" prompt="Secure Login Form" />
            <DraggableItem type="ui-component" label="Feature Grid" icon={Grid} color="indigo" prompt="3-Col Feature Grid" />
            <DraggableItem type="ui-component" label="Footer" icon={PanelBottom} color="indigo" prompt="Standard Footer" />
          </div>
        </div>

        {/* SECTION 3: LOGIC & API */}
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Logic & API</h3>
          <div className="space-y-2">
            <DraggableItem type="ai-prompt" label="AI Prompt" icon={Sparkles} color="purple" prompt="Refine logic with AI" />
            <DraggableItem type="backend-logic" label="API Endpoint" icon={Webhook} color="rose" prompt="GET /api/data" />
            <DraggableItem type="backend-logic" label="Auth Guard" icon={ShieldCheck} color="rose" prompt="Middleware Auth Check" />
          </div>
        </div>

        {/* SECTION 4: LIBRARY (Remixed/Saved) */}
        {savedComponents && savedComponents.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Your Library</h3>
            <div className="space-y-2">
              {savedComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-purple-900/10 p-3 rounded-lg border border-purple-500/30 cursor-grab hover:bg-purple-900/20 text-purple-200"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', comp.type);
                    e.dataTransfer.setData('application/label', comp.label);
                    e.dataTransfer.setData('application/savedData', JSON.stringify(comp.data));
                  }}
                >
                  <span className="text-xs font-bold">{comp.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          Drag blocks to the canvas.<br />Double-click nodes to edit.
        </p>
      </div>
    </aside>
  );
}