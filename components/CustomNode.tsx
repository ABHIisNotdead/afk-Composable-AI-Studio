import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { Bot, Code2, Database, Layout, Webhook, ShieldCheck, Box, Sparkles } from 'lucide-react';

const ICONS: Record<string, any> = {
    'start': Bot,
    'prog-lang': Code2,
    'database': Database,
    'ui-component': Layout,
    'backend-logic': Webhook,
    'input': Box,
    'ai-prompt': Sparkles
};

interface CustomNodeData extends Record<string, unknown> {
    label: string;
    type: string;
    prompt?: string;
    language?: string;
}

const CustomNode = ({ id, data, selected }: NodeProps) => {
    const nodeData = data as unknown as CustomNodeData;
    const Icon = ICONS[nodeData.type] || Box;

    // Helper to update node data without re-rendering everything
    // In a real app, you might pass a setNodes callback via context or props if not using the store hooks directly
    // But standard ReactFlow way for loose coupling is to assume data is handled by the parent or store overrides
    // Here we will use a loose approach: The parent executes the flow based on 'nodes', so we need 'onDataChange' 
    // actually we need to update the global state. 
    // However, for this simple implementation, we can trust ReactFlow's internal state if we bind value?
    // No, we must update the main nodes state in Page.tsx.
    // Using className 'nodrag' on inputs allows text selection WITHOUT dragging the node.

    return (
        <>
            <div className={`relative min-w-[300px] bg-slate-900 rounded-xl shadow-xl border-2 transition-all group flex flex-col
        ${selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-slate-700 hover:border-slate-600'}`}>

                {/* Header */}
                <div className={`h-11 flex items-center px-4 gap-3 bg-slate-950/50 border-b border-white/5 rounded-t-xl`}>
                    <div className={`p-1.5 rounded bg-slate-800 text-slate-400`}>
                        <Icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-slate-200 tracking-wide flex-1">{data.label as string}</span>
                </div>

                {/* Content Area */}
                <div className="p-4 bg-slate-900 flex flex-col gap-3 rounded-b-xl">
                    <label className="text-xs uppercase font-bold text-slate-500">Instruction / Prompt</label>
                    <textarea
                        className="nodrag w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-y min-h-[100px] leading-relaxed"
                        placeholder="Describe what this step should do..."
                        defaultValue={data.prompt as string}
                        onChange={(e) => {
                            // We need a way to bubble this up. 
                            // Usually we inject a callback in 'data' or use useReactFlow()
                            data.prompt = e.target.value;
                        }}
                    />
                </div>

                {/* Footer / Status if needed */}
                {data.language && (
                    <div className="px-3 py-1.5 bg-slate-950 border-t border-white/5 flex gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">{data.language as string}</span>
                    </div>
                )}

                {/* Handles */}
                <Handle type="target" position={Position.Left} className="w-5 h-5 bg-slate-600 border-[3px] border-slate-900 shadow-md hover:bg-slate-400 transition-colors -ml-2" />
                <Handle type="source" position={Position.Right} className="w-5 h-5 bg-indigo-500 border-[3px] border-slate-900 shadow-md hover:bg-indigo-400 transition-colors -mr-2" />
            </div>
        </>
    );
};

export default memo(CustomNode);
