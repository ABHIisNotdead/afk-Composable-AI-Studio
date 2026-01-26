import React, { useState } from 'react';
import { 
  LayoutTemplate, Smartphone, Type, MousePointerClick, 
  Search, Image as ImageIcon, Box, Database, Sparkles, 
  CreditCard, Menu, ToggleLeft, PlayCircle, Save, Trash2, Code 
} from 'lucide-react';

type SidebarProps = {
  savedComponents?: any[];
  onDeleteSaved?: (id: string) => void;
};

export default function Sidebar({ savedComponents = [], onDeleteSaved }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'saved'>('library');

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, savedData?: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    
    // If dragging a saved component, pass its stored data (remix data)
    if (savedData) {
        event.dataTransfer.setData('application/savedData', JSON.stringify(savedData));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const DraggableItem = ({ type, label, icon: Icon, color, savedData, onDelete }: any) => (
    <div 
      className="flex items-center justify-between p-3 mb-2 bg-slate-800 rounded-lg cursor-grab hover:bg-slate-700 hover:ring-1 hover:ring-indigo-500 transition-all group select-none active:cursor-grabbing"
      onDragStart={(event) => onDragStart(event, type, label, savedData)}
      draggable
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${color} bg-opacity-20 text-white group-hover:scale-110 transition-transform`}>
            <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-slate-300 group-hover:text-white">{label}</span>
      </div>
      {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="text-slate-500 hover:text-red-500 p-1"
          >
              <Trash2 className="h-3.5 w-3.5" />
          </button>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Tab Switcher */}
      <div className="flex p-2 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <button 
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-l-md transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
            Library
        </button>
        <button 
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2 text-xs font-bold uppercase rounded-r-md transition-all ${activeTab === 'saved' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
            Saved ({savedComponents.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'library' ? (
            <>
                {/* 1. Project Config */}
                {/* 1. Project Config */}
<div>
  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 px-1 tracking-widest">Stack Config</h3>
  <DraggableItem type="start" label="Start Project" icon={PlayCircle} color="bg-green-500" />
  <DraggableItem type="prog-lang" label="Programming Language" icon={Code} color="bg-orange-500" />
  <DraggableItem type="database" label="Database System" icon={Database} color="bg-cyan-600" />
</div>

                {/* 2. Intelligence Blocks */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 px-1 tracking-widest">Intelligence</h3>
                  <DraggableItem type="ai-worker" label="AI Model" icon={Sparkles} color="bg-rose-600" />
                  <DraggableItem type="image-gen" label="Image Generator" icon={ImageIcon} color="bg-indigo-600" />
                  <DraggableItem type="database" label="Data Source" icon={Database} color="bg-cyan-600" />
                </div>

                {/* 3. UI Blocks */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 px-1 tracking-widest">UI Elements</h3>
                  <DraggableItem type="input" label="Text Field" icon={Type} color="bg-indigo-500" />
                  <DraggableItem type="button" label="Action Button" icon={MousePointerClick} color="bg-emerald-500" />
                  <DraggableItem type="card" label="Content Card" icon={CreditCard} color="bg-slate-500" />
                </div>
            </>
        ) : (
            <>
                {/* Saved/Remix Tab */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3 px-1 tracking-widest">My Remixes</h3>
                    {savedComponents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <Box className="h-8 w-8 text-slate-700 mb-2" />
                            <p className="text-xs text-slate-600 italic">No saved blocks yet. Edit a node and click 'Remix Block' to see it here.</p>
                        </div>
                    ) : (
                        savedComponents.map((comp) => (
                            <DraggableItem 
                                key={comp.id} 
                                type={comp.type} 
                                label={comp.label} 
                                icon={Box} 
                                color="bg-purple-500"
                                savedData={comp.data} 
                                onDelete={() => onDeleteSaved && onDeleteSaved(comp.id)}
                            />
                        ))
                    )}
                </div>
            </>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800">
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <p className="text-[10px] text-indigo-300 leading-tight">
                  <strong>Tip:</strong> Drag blocks into the canvas and connect them to build your AI logic sequence.
              </p>
          </div>
      </div>
    </div>
  );
}