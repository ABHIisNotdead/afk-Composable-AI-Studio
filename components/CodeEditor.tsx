import React from 'react';
import { Save, FileCode } from 'lucide-react';

type CodeEditorProps = {
  filename: string;
  code: string;
  onChange: (newCode: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function CodeEditor({ filename, code, onChange, onSave, onClose }: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white font-mono text-sm">
      
      {/* Editor Header */}
      <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-[#3e3e3e] shrink-0">
        <div className="flex items-center gap-2 text-slate-300">
          <FileCode className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium">{filename}</span>
          <span className="text-[10px] bg-[#3e3e3e] px-2 py-0.5 rounded text-slate-400">Edited</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onSave}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs transition-colors"
            >
                <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button 
                onClick={onClose}
                className="px-3 py-1 hover:bg-[#3e3e3e] rounded text-xs text-slate-400 hover:text-white transition-colors"
            >
                Close
            </button>
        </div>
      </div>

      {/* Text Area */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full bg-[#1e1e1e] text-slate-300 p-4 outline-none resize-none font-mono leading-relaxed"
            spellCheck={false}
        />
      </div>
    </div>
  );
}