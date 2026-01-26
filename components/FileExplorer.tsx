// src/components/FileExplorer.tsx
import { FileCode, Download, CloudUpload } from 'lucide-react';

// Inside src/components/FileExplorer.tsx
// Inside src/components/FileExplorer.tsx
export default function FileExplorer({ 
  files, 
  activeFile, 
  onSelect, 
  onApprove, 
  isPreviewMode 
}: any) {
  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* 1. FILE LIST CONTAINER */}
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
          Project Assets
        </h3>
        <div className="space-y-0.5">
          {Object.keys(files).map((file) => (
            <button
              key={file}
              onClick={() => onSelect(file)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                activeFile === file 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Folder size={14} className="opacity-50" />
              {file}
            </button>
          ))}
        </div>
      </div>

      {/* 2. APPROVAL FOOTER (Positioned below files) */}
      {isPreviewMode && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg mb-4">
            <p className="text-[10px] text-amber-200/80 leading-relaxed font-medium">
              This preview is a standalone mockup. Generate the full production scaffold?
            </p>
          </div>
          
          <button
            onClick={onApprove}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
          >
            <Box size={16} className="group-hover:rotate-12 transition-transform" />
            Approve & Build Folder
          </button>
        </div>
      )}
    </div>
  );
}