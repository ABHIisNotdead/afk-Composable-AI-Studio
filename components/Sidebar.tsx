// src/components/Sidebar.tsx
import React from 'react';
import { Bot, FileText, Database, Terminal } from 'lucide-react';

export default function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    // We attach the node type and label to the drag event so the canvas knows what was dropped
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-4">
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Toolbox</h3>
      
      <div className="space-y-3">
        {/* Draggable Items */}
        <div 
          className="bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-grab hover:border-indigo-500 transition-colors flex items-center gap-3 text-white"
          onDragStart={(event) => onDragStart(event, 'default', 'AI Model')} 
          draggable
        >
          <Bot className="h-5 w-5 text-indigo-400" />
          <span>AI Model</span>
        </div>

        <div 
          className="bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-grab hover:border-emerald-500 transition-colors flex items-center gap-3 text-white"
          onDragStart={(event) => onDragStart(event, 'input', 'User Input')} 
          draggable
        >
          <FileText className="h-5 w-5 text-emerald-400" />
          <span>User Input</span>
        </div>

        <div 
          className="bg-slate-800 p-3 rounded-lg border border-slate-700 cursor-grab hover:border-amber-500 transition-colors flex items-center gap-3 text-white"
          onDragStart={(event) => onDragStart(event, 'default', 'Database')} 
          draggable
        >
          <Database className="h-5 w-5 text-amber-400" />
          <span>Database</span>
        </div>
      </div>
      
      <div className="mt-auto p-4 bg-slate-800/50 rounded-lg">
        <p className="text-xs text-slate-500">Drag these blocks onto the canvas to build your flow.</p>
      </div>
    </aside>
  );
}