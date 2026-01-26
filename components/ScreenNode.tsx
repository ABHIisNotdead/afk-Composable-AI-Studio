import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';

const ScreenNode = ({ data, selected }: NodeProps) => {
  return (
    <>
      <NodeResizer minWidth={200} minHeight={300} isVisible={selected} />
      
      <div className={`relative w-full h-full bg-white rounded-lg shadow-xl border-[3px] transition-all overflow-hidden group flex flex-col
        ${selected ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-800'}`}>
        
        {/* Window Header */}
        <div className="h-8 bg-slate-800 flex items-center px-3 justify-between shrink-0 cursor-grab active:cursor-grabbing">
          <span className="text-xs text-white font-bold tracking-wider flex items-center gap-2">
             <span className="opacity-50">📱</span> {data.label as string}
          </span>
          <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50 relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '15px 15px' }} 
          />
          <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-mono pointer-events-none select-none">
              Drag UI Nodes Here
          </div>
        </div>

        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-indigo-500" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-indigo-500" />
      </div>
    </>
  );
};

export default memo(ScreenNode);