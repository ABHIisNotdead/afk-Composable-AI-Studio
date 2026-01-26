import React from 'react';
import { Wifi, Battery, Signal, X, Loader2 } from 'lucide-react';

type DeviceSimulatorProps = {
  isOpen: boolean;
  onClose: () => void;
  generatedCode: string | null;
  loading: boolean;
  deviceType: 'mobile' | 'desktop';
};

export default function DeviceSimulator({ isOpen, onClose, generatedCode, loading, deviceType }: DeviceSimulatorProps) {
  if (!isOpen) return null;

  const isMobile = deviceType === 'mobile';

  return (
    <div className="w-full h-full bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 relative transition-all duration-300">

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur shrink-0">
        <span className="font-bold text-white text-sm">Live Preview ({isMobile ? 'Mobile' : 'Desktop'})</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-950/50 p-4 overflow-hidden">

        {/* DEVICE FRAME */}

        <div
          className={`relative bg-slate-900 shadow-2xl overflow-hidden ring-4 ring-black flex flex-col shrink-0 transition-all duration-500 ease-in-out
            ${isMobile
              ? 'w-[300px] h-[600px] border-[8px] border-slate-800 rounded-[3rem]'
              : 'w-full h-full max-w-5xl max-h-[800px] border-[4px] border-slate-800 rounded-lg'
            }
          `}
        >

          {/* Status Bar */}
          <div className="h-7 bg-black flex items-center justify-between px-5 shrink-0 z-10 text-white">
            <span className="text-[10px] font-medium">9:41</span>
            <div className="flex gap-1.5 opacity-90">
              <Signal className="h-2.5 w-2.5" />
              <Wifi className="h-2.5 w-2.5" />
              <Battery className="h-2.5 w-2.5" />
            </div>
          </div>

          {/* SCREEN */}
          <div className="flex-1 bg-white overflow-hidden relative">

            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-xs font-mono animate-pulse">Generating UI...</span>
              </div>
            ) : generatedCode ? (
              // THE FIX: We wrap the code in a full HTML shell to remove margins
              <iframe
                srcDoc={`
                   <!DOCTYPE html>
                   <html>
                     <head>
                       <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                       <script src="https://cdn.tailwindcss.com"></script>
                       <style>
                         /* CSS RESET */
                         html, body { 
                           margin: 0; 
                           padding: 0; 
                           width: 100%; 
                           height: 100%; 
                           overflow-x: hidden;
                         }
                         /* Hide scrollbar for mobile feel */
                         ::-webkit-scrollbar { display: none; }
                       </style>
                     </head>
                     <body>
                       ${generatedCode}
                     </body>
                   </html>
                 `}
                className="w-full h-full border-none block"
                title="App Preview"
                sandbox="allow-scripts"
              />
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
                  <span className="text-3xl">🎨</span>
                </div>
                <p className="text-sm font-medium text-slate-600">No App Generated</p>
                <p className="text-xs max-w-[180px] text-center opacity-70">
                  Click "Run App" to turn your flow into a real UI.
                </p>
              </div>
            )}
          </div>

          {/* Home Bar */}
          <div className="h-6 bg-black absolute bottom-0 w-full flex justify-center items-end pb-2 pointer-events-none">
            <div className="w-32 h-1 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}