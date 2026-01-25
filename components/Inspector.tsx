// src/components/Inspector.tsx
import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

type InspectorProps = {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onClose: () => void;
};

export default function Inspector({ selectedNode, selectedEdge, setNodes, setEdges, onClose }: InspectorProps) {
  const [label, setLabel] = useState('');
  const [prompt, setPrompt] = useState('');

  // Update form when selection changes
  useEffect(() => {
    if (selectedNode) {
      setLabel((selectedNode.data.label as string) || '');
      setPrompt((selectedNode.data.prompt as string) || '');
    }
  }, [selectedNode]);

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return { ...node, data: { ...node.data, label: newLabel } };
          }
          return node;
        })
      );
    }
  };

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return { ...node, data: { ...node.data, prompt: newPrompt } };
          }
          return node;
        })
      );
    }
  };

  // --- DELETE FUNCTION ---
  const handleDelete = () => {
    if (selectedNode) {
      // Delete Node AND its connections
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    } else if (selectedEdge) {
      // Delete Just the Link
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    }
    onClose(); // Close inspector
  };

  if (!selectedNode && !selectedEdge) return null;

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl z-20 absolute right-0 top-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-lg">
          {selectedNode ? 'Edit Node' : 'Edit Connection'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 flex-1">
        
        {/* If a NODE is selected */}
        {selectedNode && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Node Name
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {selectedNode.type === 'default' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  System Prompt
                </label>
                <textarea
                  rows={6}
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="You are a helpful assistant..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm"
                />
              </div>
            )}
          </>
        )}

        {/* If an EDGE is selected */}
        {selectedEdge && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-sm text-slate-400">
              Selected Link ID: <br/>
              <span className="font-mono text-xs text-slate-500">{selectedEdge.id}</span>
            </p>
          </div>
        )}

      </div>

      {/* Delete Button (Always at bottom) */}
      <button 
        onClick={handleDelete}
        className="mt-auto flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 p-3 rounded-lg transition-colors font-medium"
      >
        <Trash2 className="h-4 w-4" />
        {selectedNode ? 'Delete Node' : 'Disconnect Link'}
      </button>

    </aside>
  );
}