// src/components/Inspector.tsx
import React, { useEffect, useState } from 'react';
import { X, Trash2, Check, Save } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

type InspectorProps = {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onClose: () => void;
  onSave?: () => void; // Optional: Call this to trigger Supabase sync
};

export default function Inspector({ selectedNode, selectedEdge, setNodes, setEdges, onClose, onSave }: InspectorProps) {
  const [localLabel, setLocalLabel] = useState('');
  const [localPrompt, setLocalPrompt] = useState('');

  // Only update local state when the selection actually changes
  useEffect(() => {
    if (selectedNode) {
      setLocalLabel((selectedNode.data.label as string) || '');
      setLocalPrompt((selectedNode.data.prompt as string) || '');
    }
  }, [selectedNode?.id]); // Use .id to prevent re-runs on data changes

  const handleApplyChanges = () => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return { 
              ...node, 
              data: { ...node.data, label: localLabel, prompt: localPrompt } 
            };
          }
          return node;
        })
      );
      
      // Trigger global save if provided
      if (onSave) onSave();
      
      // Visual feedback: Close inspector or show a success state
      onClose();
    }
  };

  const handleDelete = () => {
    const message = selectedNode ? "Delete this node and all its connections?" : "Remove this link?";
    if (!window.confirm(message)) return;

    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    } else if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    }
    onClose();
  };

  if (!selectedNode && !selectedEdge) return null;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl z-[100] absolute right-0 top-0">
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">
          {selectedNode ? 'Edit Block' : 'Edit Link'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 flex-1">
        {selectedNode && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Label
              </label>
              <input
                type="text"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Configuration / Prompt
              </label>
              <textarea
                rows={8}
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm font-mono"
                placeholder="Enter node instructions..."
              />
            </div>
          </>
        )}

        {selectedEdge && (
          <div className="p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
            <p className="text-xs text-indigo-300 leading-relaxed">
              This link manages the data flow between blocks. Deleting it will stop the sequence at the source node.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-auto space-y-3 pt-4 border-t border-slate-800">
        <button 
          onClick={handleApplyChanges}
          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg transition-all font-bold text-sm shadow-lg shadow-indigo-500/20"
        >
          <Save className="h-4 w-4" />
          Apply & Save
        </button>

        <button 
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 w-full text-slate-500 hover:text-red-400 p-2 transition-colors text-xs font-semibold"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {selectedNode ? 'Remove Node' : 'Delete Link'}
        </button>
      </div>

    </aside>
  );
}