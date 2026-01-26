import React from 'react';
import { Wifi, Battery, Signal, X, Loader2, Monitor, Smartphone } from 'lucide-react';

type DeviceSimulatorProps = {
  isOpen: boolean;
  onClose: () => void;
  generatedCode: string | null;
  loading: boolean;
  deviceType: 'mobile' | 'desktop'; 
};

export default function DeviceSimulator({ isOpen, onClose, generatedCode, loading, deviceType }: DeviceSimulatorProps) {
  if (!isOpen) return null;

  // FIX: Removed fixed width classes. Now uses w-full to fill the parent resizable pane.
  const containerClass = "w-full h-full bg-slate-900 flex flex-col shrink-0 relative transition-all duration-300";

  // FIX: Mobile stays fixed size centered. Desktop becomes responsive percentage.
  const frameClass = deviceType === 'mobile'
    ? "w-[300px] h-[600px] rounded-[3rem] border-[8px]" 
    : "w-[90%] h-[80%] max-w-[1200px] rounded-lg border-[1px] aspect-video"; 

  return (
    <div className={containerClass}>
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur shrink-0">
        <span className="font-bold text-white text-sm flex items-center gap-2">
            {deviceType === 'mobile' ? <Smartphone className="h-4 w-4 text-indigo-400"/> : <Monitor className="h-4 w-4 text-indigo-400"/>}
            Live Preview
        </span>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-950/50 p-4 overflow-hidden">
        <div className={`relative ${frameClass} bg-slate-900 border-slate-800 shadow-2xl overflow-hidden ring-4 ring-black flex flex-col shrink-0 transition-all`}>
          <div className="h-7 bg-black flex items-center justify-between px-4 shrink-0 z-10 text-white border-b border-slate-800">
            {deviceType === 'mobile' ? (
                <>
                    <span className="text-[10px] font-medium">9:41</span>
                    <div className="flex gap-1.5 opacity-90">
                        <Signal className="h-2.5 w-2.5" />
                        <Wifi className="h-2.5 w-2.5" />
                        <Battery className="h-2.5 w-2.5" />
                    </div>
                </>
            ) : (
                <div className="flex gap-2 items-center w-full">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-400 text-center font-mono">
                        localhost:3000
                    </div>
                </div>
            )}
          </div>

          <div className="flex-1 bg-white overflow-hidden relative">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-xs font-mono animate-pulse">Building...</span>
              </div>
            ) : generatedCode ? (
               <iframe 
                 srcDoc={`
                   <!DOCTYPE html>
                   <html>
                     <head>
                       <meta name="viewport" content="width=device-width, initial-scale=1.0">
                       <script src="https://cdn.tailwindcss.com"></script>
                       <style>
                         html, body { margin:0; padding:0; width:100%; height:100%; overflow-x:hidden; }
                         ::-webkit-scrollbar { display: none; }
                       </style>
                     </head>
                     <body>${generatedCode}</body>
                   </html>
                 `}
                 className="w-full h-full border-none block"
                 title="Preview"
                 sandbox="allow-scripts" 
               />
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                 <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2"><span className="text-3xl">🎨</span></div>
                 <p className="text-xs opacity-70">Run flow to preview</p>
               </div>
            )}
          </div>
          
          {deviceType === 'mobile' && (
              <div className="h-6 bg-black absolute bottom-0 w-full flex justify-center items-end pb-2 pointer-events-none">
                  <div className="w-32 h-1 bg-white/50 rounded-full" />
              </div>
          )}
        </div>
      </div>
    </div>
  );
}