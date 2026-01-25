"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { 
  ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, 
  Connection, ReactFlowProvider, useReactFlow, Node, Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Save, ArrowLeft, Loader2, Play, Terminal, Smartphone, MessageSquare, Layout, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Inspector from '@/components/Inspector';
import OutputPanel from '@/components/OutputPanel'; 
import DeviceSimulator from '@/components/DeviceSimulator';
import ChatPanel from '@/components/ChatPanel';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Start Here' }, type: 'input' },
];

// --- LAYOUT CONFIGURATION ---
type LayoutConfig = {
  name: string;
  leftWidth: number;
  rightWidth: number;
  chatHeight: number;
  consoleHeight: number;
  isChatOpen: boolean;
  isOutputOpen: boolean;
  isDeviceOpen: boolean;
};

const LAYOUT_PRESETS: Record<string, LayoutConfig> = {
  "Standard": { name: "Standard", leftWidth: 320, rightWidth: 400, chatHeight: 400, consoleHeight: 200, isChatOpen: true, isOutputOpen: true, isDeviceOpen: false },
  "Focus Mode": { name: "Focus Mode", leftWidth: 0, rightWidth: 0, chatHeight: 0, consoleHeight: 0, isChatOpen: false, isOutputOpen: false, isDeviceOpen: false },
  "Mobile Dev": { name: "Mobile Dev", leftWidth: 300, rightWidth: 450, chatHeight: 0, consoleHeight: 250, isChatOpen: false, isOutputOpen: true, isDeviceOpen: true },
  "Debug Central": { name: "Debug Central", leftWidth: 350, rightWidth: 0, chatHeight: 500, consoleHeight: 300, isChatOpen: true, isOutputOpen: true, isDeviceOpen: false },
};

// --- RESIZE HANDLE ---
const ResizeHandle = ({ direction, onMouseDown }: { direction: 'horizontal' | 'vertical', onMouseDown: (e: React.MouseEvent) => void }) => (
  <div 
    className={`${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'} bg-slate-900 hover:bg-indigo-500 transition-colors z-50 flex items-center justify-center shrink-0 group`}
    onMouseDown={onMouseDown}
  >
    <div className={`${direction === 'horizontal' ? 'h-8 w-0.5' : 'w-8 h-0.5'} bg-slate-700 group-hover:bg-white rounded-full transition-colors`} />
  </div>
);

function FlowEditor() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  // --- DATA STATES ---
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  
  // --- UI STATES ---
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  const [logs, setLogs] = useState<{timestamp: string, type: 'info'|'success'|'error', message: string}[]>([]);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // --- AI GENERATION STATES ---
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- RESIZING STATE ---
  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(400);
  const [chatHeight, setChatHeight] = useState(400);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const isResizing = useRef(false);

  // --- LAYOUT LOGIC ---
  useEffect(() => {
    const savedLayout = localStorage.getItem('ai-studio-layout');
    if (savedLayout) { try { applyLayout(JSON.parse(savedLayout)); } catch (e) {} }
  }, []);

  const applyLayout = (config: LayoutConfig) => {
    setLeftWidth(config.leftWidth); setRightWidth(config.rightWidth);
    setChatHeight(config.chatHeight); setConsoleHeight(config.consoleHeight);
    setIsChatOpen(config.isChatOpen); setIsOutputOpen(config.isOutputOpen); setIsDeviceOpen(config.isDeviceOpen);
    setShowLayoutMenu(false);
  };

  const saveCurrentLayout = () => {
    const config: LayoutConfig = { name: "Custom", leftWidth, rightWidth, chatHeight, consoleHeight, isChatOpen, isOutputOpen, isDeviceOpen };
    localStorage.setItem('ai-studio-layout', JSON.stringify(config));
    setShowLayoutMenu(false);
    alert("Layout saved as default!");
  };

  // --- RESIZING HANDLER ---
  const startResizing = useCallback((direction: 'x' | 'y', setter: React.Dispatch<React.SetStateAction<number>>, reverse = false) => (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
    const startPos = direction === 'x' ? mouseDownEvent.clientX : mouseDownEvent.clientY;
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const currentPos = direction === 'x' ? moveEvent.clientX : moveEvent.clientY;
      const delta = reverse ? (startPos - currentPos) : (currentPos - startPos);
      setter((prev) => Math.max(150, Math.min(prev + delta, 1200)));
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    document.body.style.cursor = direction === 'x' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const addLog = (message: string, type: 'info'|'success'|'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev, { timestamp, type, message }]);
  };

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error || !data) { router.push('/dashboard'); return; }
      setProjectTitle(data.title);
      if (data.flow_data?.nodes) { setNodes(data.flow_data.nodes); setEdges(data.flow_data.edges || []); } 
      else { setNodes(initialNodes); }
      setLoading(false);
    };
    fetchProject();
  }, [projectId, router, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleSave = async () => {
    setSaving(true); setSelectedNode(null); setSelectedEdge(null);
    const { error } = await supabase.from('projects').update({ flow_data: { nodes, edges } }).eq('id', projectId);
    setSaving(false);
    if (error) addLog(`Save failed: ${error.message}`, "error");
    else addLog("Project saved successfully.", "success");
  };

  // --- AI HANDLER WITH VISUALIZATION ---
  const handleRunAI = async (userMessage: string): Promise<string | null> => {
    addLog(`[System] Generating App UI for: "${userMessage}"...`, "info");
    setIsGenerating(true);
    
    // 1. VISUALIZATION START: Turn edges Green and Animate
    setEdges((eds) => 
      eds.map((edge) => ({
        ...edge,
        animated: true, 
        style: { stroke: '#10b981', strokeWidth: 2 }, // Emerald Green
      }))
    );
    
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges, userMessage }),
      });
      const data = await response.json();
      
      if (data.error) { 
        addLog(`[Error] ${data.error}`, "error"); 
        setIsGenerating(false);

        // 2. VISUALIZATION ERROR: Turn edges Red
        setEdges((eds) => 
            eds.map((edge) => ({
              ...edge,
              animated: false,
              style: { stroke: '#ef4444', strokeWidth: 2 }, // Red
            }))
        );
        return null; 
      }

      addLog(`[Success] UI Generated! Updating Simulator...`, "success");
      setGeneratedCode(data.result);
      setIsGenerating(false);
      
      // 3. VISUALIZATION SUCCESS: Keep Green, Stop Animation
      setEdges((eds) => 
        eds.map((edge) => ({
          ...edge,
          animated: false,
          style: { stroke: '#10b981', strokeWidth: 2 }, 
        }))
      );
      
      if (!isDeviceOpen) setIsDeviceOpen(true);
      
      return "UI Updated Successfully";

    } catch (err: any) {
      addLog("Network connection failed", "error");
      setIsGenerating(false);
      
      // Reset visualization on crash
      setEdges((eds) => eds.map((e) => ({ ...e, animated: false, style: { stroke: '#64748b' } })));
      return null;
    }
  };

  // --- THE FIX: AUTO-TRIGGER AI ON RUN ---
  const handleRunClick = async () => {
    const inputNode = nodes.find((n) => n.type === 'input');
    if (!inputNode) { alert("Missing Input Node!"); return; }
    
    // 1. Open the Layout
    applyLayout(LAYOUT_PRESETS["Mobile Dev"]);
    addLog("Build started...", "info");

    // 2. AUTO-TRIGGER AI (Use the node label as the context)
    const topic = inputNode.data.label !== "Start Here" ? inputNode.data.label : "Startup App";
    
    // Call the AI immediately!
    await handleRunAI(`Generate a modern home screen for: ${topic}`);
  };

  // Drag & Drop
  const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      if (!type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setNodes((nds) => nds.concat({ id: `${type}-${Date.now()}`, type, position, data: { label: label, prompt: '' } }));
      addLog(`Node added: ${label}`, "info");
    }, [screenToFlowPosition, setNodes]
  );
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => { setSelectedNode(node); setSelectedEdge(null); }, []);
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => { setSelectedEdge(edge); setSelectedNode(null); }, []);
  const onPaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); }, []);

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col">
      {/* HEADER */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-white font-bold">{projectTitle}</h1>
          <div className="relative">
            <button onClick={() => setShowLayoutMenu(!showLayoutMenu)} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700">
                <Layout className="h-3.5 w-3.5" /><span>Layouts</span><ChevronDown className="h-3 w-3 opacity-50" />
            </button>
            {showLayoutMenu && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLayoutMenu(false)} />
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presets</div>
                    {Object.values(LAYOUT_PRESETS).map((preset) => (
                        <button key={preset.name} onClick={() => applyLayout(preset)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">{preset.name}</button>
                    ))}
                    <div className="h-px bg-slate-700 my-1 mx-3" />
                    <button onClick={saveCurrentLayout} className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-slate-700 flex items-center gap-2 font-medium"><Save className="h-3.5 w-3.5" /> Save Current as Default</button>
                </div>
                </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
             <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-1.5 rounded transition-colors ${isChatOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`} title="Debug Chat"><MessageSquare className="h-4 w-4" /></button>
             <button onClick={() => setIsOutputOpen(!isOutputOpen)} className={`p-1.5 rounded transition-colors ${isOutputOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`} title="Console"><Terminal className="h-4 w-4" /></button>
          </div>
          <button onClick={() => setIsDeviceOpen(!isDeviceOpen)} className={`p-2 rounded-lg transition-colors ${isDeviceOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Simulator"><Smartphone className="h-5 w-5" /></button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button onClick={handleRunClick} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-emerald-500/20"><Play className="h-4 w-4 fill-current" /> Run App</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-indigo-500/20">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 h-full overflow-hidden relative" onMouseUp={() => { isResizing.current = false; }}>
        
        {/* 1. LEFT COLUMN */}
        <div className="flex flex-col border-r border-slate-800 bg-slate-900 shrink-0 transition-all duration-300 ease-in-out" style={{ width: leftWidth }}>
            <div className="flex-1 overflow-y-auto"><Sidebar /></div>
            {isChatOpen && (
              <>
                 <ResizeHandle direction="vertical" onMouseDown={startResizing('y', setChatHeight, true)} />
                 <div style={{ height: chatHeight }} className="shrink-0 transition-all duration-300 ease-in-out">
                    <ChatPanel isOpen={true} onClose={() => setIsChatOpen(false)} onSendMessage={handleRunAI} />
                 </div>
              </>
            )}
        </div>
        <ResizeHandle direction="horizontal" onMouseDown={startResizing('x', setLeftWidth)} />
        
        {/* 2. CENTER COLUMN */}
        <div className="flex-1 h-full relative flex flex-col min-w-0" ref={wrapperRef}>
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
              onConnect={onConnect} onDragOver={onDragOver} onDrop={onDrop}
              onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} onPaneClick={onPaneClick}
              fitView colorMode="dark" deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background color="#334155" gap={16} />
              <Controls className="bg-slate-800 border-slate-700 fill-slate-300 mb-2" /> 
            </ReactFlow>
            {(selectedNode || selectedEdge) && !isDeviceOpen && (
              <Inspector selectedNode={selectedNode} selectedEdge={selectedEdge} setNodes={setNodes} setEdges={setEdges} onClose={() => { setSelectedNode(null); setSelectedEdge(null); }} />
            )}
          </div>
          {isOutputOpen && (
            <>
               <ResizeHandle direction="vertical" onMouseDown={startResizing('y', setConsoleHeight, true)} />
               <div style={{ height: consoleHeight }} className="bg-slate-950 shrink-0 transition-all duration-300 ease-in-out">
                  <OutputPanel isOpen={true} onClose={() => setIsOutputOpen(false)} logs={logs} onClear={() => setLogs([])} />
               </div>
            </>
          )}
        </div>

        {/* 3. RIGHT COLUMN */}
        {isDeviceOpen && <ResizeHandle direction="horizontal" onMouseDown={startResizing('x', setRightWidth, true)} />}
        {isDeviceOpen && (
           <div style={{ width: rightWidth }} className="shrink-0 h-full relative transition-all duration-300 ease-in-out">
              <DeviceSimulator 
                 isOpen={isDeviceOpen} 
                 onClose={() => setIsDeviceOpen(false)} 
                 generatedCode={generatedCode} 
                 loading={isGenerating} 
              />
           </div>
        )}
      </div>
    </div>
  );
}
export default function EditorPage() { return <ReactFlowProvider><FlowEditor /></ReactFlowProvider>; }