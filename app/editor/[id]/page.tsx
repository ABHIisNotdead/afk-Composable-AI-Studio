"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge,
  Connection, ReactFlowProvider, useReactFlow, Node, Edge, BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
// Update this line in your page.tsx
import {
  Save, ArrowLeft, Loader2, Play, Terminal, Smartphone, Monitor,
  MessageSquare, Layout, ChevronDown, Folder, Box, Eraser, MousePointer2,
  Trash2, BookmarkPlus, HeartPulse, FileText // <--- Add FileText here
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Inspector from '@/components/Inspector';
import OutputPanel from '@/components/OutputPanel';
import DeviceSimulator from '@/components/DeviceSimulator';
import ChatPanel from '@/components/ChatPanel';
import FileExplorer from '@/components/FileExplorer';
import CodeEditor from '@/components/CodeEditor';
import CustomNode from '@/components/CustomNode'; // <--- Import
import JSZip from 'jszip';

const nodeTypes = {
  'start': CustomNode,
  'prog-lang': CustomNode,
  'database': CustomNode,
  'ui-component': CustomNode,
  'backend-logic': CustomNode,
  'ai-prompt': CustomNode,
  'input': CustomNode, // Fallback for legacy
  'default': CustomNode,
  'output': CustomNode
};

const initialNodes = [
  {
    id: '1',
    type: 'start', // Changed from 'input' to 'start' to match our CustomNode mapping
    position: { x: 100, y: 100 },
    data: {
      label: 'App Configuration',
      type: 'start',
      language: 'HTML/Tailwind',
      theme: 'Modern Dark',
      prompt: 'A professional AI dashboard'
    }
  },
];

type LayoutConfig = { name: string; leftWidth: number; rightWidth: number; chatHeight: number; consoleHeight: number; isChatOpen: boolean; isOutputOpen: boolean; isDeviceOpen: boolean; };
const LAYOUT_PRESETS: Record<string, LayoutConfig> = {
  "Standard": { name: "Standard", leftWidth: 320, rightWidth: 400, chatHeight: 400, consoleHeight: 200, isChatOpen: true, isOutputOpen: true, isDeviceOpen: false },
  "Mobile Dev": { name: "Mobile Dev", leftWidth: 300, rightWidth: 450, chatHeight: 400, consoleHeight: 250, isChatOpen: true, isOutputOpen: true, isDeviceOpen: true },
  "Web Dev": { name: "Web Dev", leftWidth: 300, rightWidth: 800, chatHeight: 400, consoleHeight: 200, isChatOpen: true, isOutputOpen: true, isDeviceOpen: true },
  "Code Focus": { name: "Code Focus", leftWidth: 250, rightWidth: 0, chatHeight: 0, consoleHeight: 300, isChatOpen: false, isOutputOpen: true, isDeviceOpen: false },
  "Designer": { name: "Designer", leftWidth: 350, rightWidth: 400, chatHeight: 0, consoleHeight: 0, isChatOpen: false, isOutputOpen: false, isDeviceOpen: true },
};

const ResizeHandle = ({ direction, onMouseDown }: { direction: 'horizontal' | 'vertical', onMouseDown: (e: React.MouseEvent) => void }) => (
  <div className={`${direction === 'horizontal' ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'} bg-slate-900 hover:bg-indigo-500 transition-colors z-50 flex items-center justify-center shrink-0 group`} onMouseDown={onMouseDown}>
    <div className={`${direction === 'horizontal' ? 'h-8 w-0.5' : 'w-8 h-0.5'} bg-slate-700 group-hover:bg-white rounded-full transition-colors`} />
  </div>
);

function FlowEditor() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [savedComponents, setSavedComponents] = useState<any[]>([]);

  const clearLogs = () => setLogs([]);

  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  const [logs, setLogs] = useState<{ timestamp: string, type: 'info' | 'success' | 'error', message: string }[]>([]);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const [viewMode, setViewMode] = useState<'graph' | 'code'>('graph');
  const [sidebarTab, setSidebarTab] = useState<'nodes' | 'files'>('nodes');
  const [cursorMode, setCursorMode] = useState<'pointer' | 'eraser'>('pointer');
  const [isTrashActive, setIsTrashActive] = useState(false);

  const keyDownTimeRef = useRef<number>(0);

  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [isGenerating, setIsGenerating] = useState(false);

  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(400);
  const [chatHeight, setChatHeight] = useState(400);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const isResizing = useRef(false);

  const [outputTab, setOutputTab] = useState<'console' | 'plan' | 'images' | 'prompt'>('console');
  const [textOutput, setTextOutput] = useState<string>("");
  const [promptOutput, setPromptOutput] = useState<string>(""); // New state for showing the prompt
  const [imageOutputs, setImageOutputs] = useState<string[]>([]); // URLs of generated images


  // 1. Updated Download Logic (Creates a real .zip bundle)
  const downloadProject = async () => {
    if (Object.keys(files).length === 0) {
      addLog("No files generated yet.", "error");
      return;
    }

    const zip = new JSZip();
    // Loop through all files the AI created (index.html, script.js, etc.)
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content as string);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectTitle.replace(/\s+/g, '_')}_v1.zip`;
    link.click();
    addLog("Full application bundle downloaded!", "success");
  };

  // 2. Updated Save Logic (Persists Graph + Code to Supabase)
  // Consolidate into this ONE function
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          flow_data: { nodes, edges },
          generated_code: files // This ensures your AI code is saved too!
        })
        .eq('id', projectId);

      if (error) throw error;
      setSaving(false);
      addLog("Project and Source Code saved to DB.", "success");
    } catch (err) {
      console.error("Save Error:", err);
      addLog("Save failed. Check database schema.", "error");
      setSaving(false);
    }
  };

  useEffect(() => {
    const savedLayout = localStorage.getItem('ai-studio-layout');
    if (savedLayout) { try { const l = JSON.parse(savedLayout); applyLayout(l); } catch (e) { } }
  }, []);

  const applyLayout = (config: LayoutConfig) => {
    setLeftWidth(config.leftWidth); setRightWidth(config.rightWidth);
    setChatHeight(config.chatHeight); setConsoleHeight(config.consoleHeight);
    setIsChatOpen(config.isChatOpen); setIsOutputOpen(config.isOutputOpen); setIsDeviceOpen(config.isDeviceOpen);
    if (config.rightWidth > 500) setDeviceType('desktop'); else setDeviceType('mobile');
    setShowLayoutMenu(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
      if (e.key.toLowerCase() === 'e' && !e.repeat) { keyDownTimeRef.current = Date.now(); setCursorMode('eraser'); }
      if (e.key.toLowerCase() === 'v' || e.key === 'Escape') setCursorMode('pointer');
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'e') { if (Date.now() - keyDownTimeRef.current > 250) setCursorMode('pointer'); }
    };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  const startResizing = (
    direction: 'x' | 'y',
    setter: React.Dispatch<React.SetStateAction<number>>,
    reverse = false
  ) => (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();

    const onMouseMove = (moveEvent: MouseEvent) => {
      // We use movementX/Y for smooth delta-based resizing
      const delta = direction === 'x' ? moveEvent.movementX : moveEvent.movementY;

      setter((prev) => {
        // Calculate the new size based on the movement
        const newSize = prev + (reverse ? -delta : delta);

        // HARD CLAMPING: Prevents the panel from covering the whole screen
        // Min size: 150px, Max size: 800px (adjust based on your screen)
        if (newSize < 150) return 150;
        if (newSize > 900) return 900;

        return newSize;
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Optional: add a class to body to re-enable text selection
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Visual polish: keep the resize cursor active while dragging
    document.body.style.cursor = direction === 'x' ? 'col-resize' : 'row-resize';
  };

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
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

      // Restore generated files
      if (data.generated_code) {
        setFiles(data.generated_code);
        // If we have files, ensure output tab is visible to show we have content
        if (Object.keys(data.generated_code).length > 0) {
          setIsOutputOpen(true);
          setSidebarTab('files');
        }
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId, router, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);



  const handleSaveComponent = () => {
    if (!selectedNode) return;
    const newSavedItem = {
      id: `remix-${Date.now()}`,
      label: selectedNode.data.label || "Custom Node",
      type: selectedNode.type,
      data: { ...selectedNode.data }
    };
    setSavedComponents([...savedComponents, newSavedItem]);
    addLog(`Remixed ${newSavedItem.label} to Library`, "success");
  };
  const executeAction = async (
    userMessage: string,
    isRun: boolean
  ): Promise<string | null> => {
    const logPrefix = isRun ? "[Compiler]" : "[Consultant]";
    addLog(`${logPrefix} Processing request...`, "info");

    if (isRun) setIsGenerating(true);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map(n => ({ id: n.id, data: n.data })),
          edges: edges.map(e => ({ source: e.source, target: e.target })),
          userMessage,
          files, // <--- Send existing files as context
          isRunCommand: isRun,
        }),
      });

      // 1. Handle Server-Side Failures (503/429)
      if (!response.ok) {
        if (response.status === 503) throw new Error("Gemini is overloaded. Wait 10s.");
        if (response.status === 429) throw new Error("Rate limit hit. Slow down!");
        throw new Error("Server communication failed.");
      }

      const data = await response.json();

      // 1.1 Show Debug Prompt (New Feature)
      if (data.debugPrompt) {
        setPromptOutput(data.debugPrompt);
        // Optionally auto-switch to prompt tab or log it
        addLog("AI Prompt generated. Check 'Prompt' tab.", "info");
      }

      if (!data.result) throw new Error("AI returned an empty response.");

      // 2. Advanced JSON Extraction (Handles Markdown & Truncation)
      let parsed;
      try {
        // Find the block between the FIRST '{' and the LAST '}'
        const firstBracket = data.result.indexOf('{');
        const lastBracket = data.result.lastIndexOf('}');

        if (firstBracket === -1 || lastBracket === -1) {
          throw new Error("No valid JSON found in response.");
        }

        const cleanJson = data.result.substring(firstBracket, lastBracket + 1);
        parsed = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Parse Error Raw Data:", data.result);
        throw new Error("Code was truncated by AI. Try a shorter prompt.");
      }

      /* ---------- SUCCESS PATH: Update Files & Database ---------- */
      // DEBUG: Log the full response to text output so user can see it
      setTextOutput(`🔍 AI RESPONSE DEBUG:\n${JSON.stringify(parsed, null, 2)}\n\n${parsed.text || ''}`);

      if (isRun) {
        if (!parsed.standaloneFile && !parsed.files) {
          throw new Error("AI successfully replied but did NOT return any code (standaloneFile/files missing). See DEBUG above.");
        }

        const updatedFiles = parsed.standaloneFile
          ? { 'index.html': parsed.standaloneFile }
          : parsed.files;

        setFiles(updatedFiles);

        // SYNC TO SUPABASE
        const { error: dbError } = await supabase
          .from('projects')
          .update({ generated_code: updatedFiles })
          .eq('id', projectId);

        if (!dbError) addLog("Cloud Sync: Success", "info");

        if (parsed.standaloneFile) {
          setIsDeviceOpen(true);
          setDeviceType('mobile'); // Force mobile view for freshness
          addLog(`${logPrefix} Preview ready for video.`, "success");
        } else {
          setSidebarTab('files');
          addLog(`${logPrefix} Project built.`, "success");
        }
      }

      /* ---------- UI UPDATES ---------- */
      // Show Thinking/Plan
      if (parsed.thinking) {
        setTextOutput(parsed.thinking);
        setOutputTab('plan');
        setIsOutputOpen(true);
      } else if (parsed.text) {
        setTextOutput(parsed.text);
        setOutputTab('plan');
        setIsOutputOpen(true);
      }

      if (parsed.imageUrl) {
        setImageOutputs(prev => [...prev, parsed.imageUrl]);
        setOutputTab('images');
        setIsOutputOpen(true);
      }

      return parsed.message || "Action completed.";

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Critical Engine Error";
      console.error("ExecuteAction Failure:", err);
      addLog(`Error: ${errorMsg}`, "error");

      // Explicitly show error in text panel too so user sees it
      setTextOutput(`🚨 GENERATION FAILED: ${errorMsg}\n\nCheck the console logs for more details.`);
      setOutputTab('plan');
      setIsOutputOpen(true);

      // Trigger Cooldown if it's a server overload
      if (errorMsg.includes("overloaded")) {
        // setIsCooldown(true); // Assuming setIsCooldown exists in scope or remove if not
        // setTimeout(() => setIsCooldown(false), 10000);
      }
      return null;
    } finally {
      setIsGenerating(false);

    }
  };
  // Inside FlowEditor component
  const handleApproveAndExport = useCallback(() => {
    addLog("Approval received. Building production scaffold...", "info");
    // The keyword 'Approve' or 'Export' triggers the scaffold branch in your API
    executeAction("Approve and export full project scaffold", true);
  }, [executeAction, addLog]);

  const handleRunClick = async () => {
    const startNode = nodes.find((n) => n.data?.type === 'start');
    if (!startNode) { addLog("Missing Start Node!", "error"); return; }

    // 1. Create a Unique Fingerprint of the current Logic
    const currentFingerprint = JSON.stringify({
      nodes: nodes.map(n => ({ id: n.id, data: n.data })),
      edges: edges.map(e => ({ source: e.source, target: e.target }))
    });

    // 2. Compare with the last successful build stored in LocalStorage
    const lastBuildHash = localStorage.getItem(`build-hash-${projectId}`);

    if (currentFingerprint === lastBuildHash && Object.keys(files).length > 0) {
      addLog("[Cache] No logic changes detected. Loading stored build...", "success");
      setIsDeviceOpen(true);
      return;
    }

    // 3. If it's new or changed, execute the AI action
    const message = await executeAction("Analyze changes and rebuild", true);

    if (message) {
      // 4. Store the hash for next time
      localStorage.setItem(`build-hash-${projectId}`, currentFingerprint);
      addLog("[Compiler] New build stored successfully.", "success");
    }
  };

  const handleFileSelect = (filename: string) => { setActiveFile(filename); setViewMode('code'); };
  const handleCodeChange = (newCode: string) => { setFiles((prev) => ({ ...prev, [activeFile]: newCode })); };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (cursorMode === 'eraser') { setNodes((nds) => nds.filter((n) => n.id !== node.id)); setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id)); }
    else { setSelectedNode(node); setSelectedEdge(null); }
  }, [cursorMode, setNodes, setEdges]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (cursorMode === 'eraser') { setEdges((eds) => eds.filter((e) => e.id !== edge.id)); }
    else { setSelectedEdge(edge); setSelectedNode(null); }
  }, [cursorMode, setEdges]);

  const onNodeDrag = useCallback((event: React.MouseEvent) => {
    if (!trashRef.current) return;
    const r = trashRef.current.getBoundingClientRect();
    setIsTrashActive(event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom);
  }, []);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (isTrashActive) { setNodes((nds) => nds.filter((n) => n.id !== node.id)); setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id)); setIsTrashActive(false); }
  }, [isTrashActive, setNodes, setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/label');
    const prompt = event.dataTransfer.getData('application/prompt'); // New field
    const savedDataString = event.dataTransfer.getData('application/savedData');

    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    // 1. Initial Data Setup with Modular Presets
    let nodeData = {
      label: label,
      type: type,
      // Use the passed prompt from Sidebar, or default to empty
      prompt: prompt || ""
    };

    if (savedDataString) {
      nodeData = JSON.parse(savedDataString);
    }

    // 2. Default Styling Base
    // 3. Create the New Node Object
    const newNode: Node = {
      id: `dndnode_${Date.now()}`,
      type: type,
      position: position,
      data: nodeData,
      style: undefined, // CustomNode handles styling
    };

    setNodes((nds) => nds.concat(newNode));
    addLog(`Added ${label} to project`, "info");
  }, [screenToFlowPosition, setNodes]);

  const onPaneClick = useCallback(() => { setSelectedNode(null); setSelectedEdge(null); }, []);

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-mono animate-pulse">Initializing Studio...</div>;

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-20 relative">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-white font-bold">{projectTitle}</h1>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setCursorMode('pointer')}
              title="Select Tool (V) - Move and edit nodes"
              className={`p-1.5 rounded transition-all ${cursorMode === 'pointer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MousePointer2 size={16} />
            </button>
            <button
              onClick={() => setCursorMode('eraser')}
              title="Eraser Tool (E) - Click any node or link to delete"
              className={`p-1.5 rounded transition-all ${cursorMode === 'eraser' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Eraser size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${JSON.stringify({ nodes, edges }) === localStorage.getItem(`build-hash-${projectId}`)
              ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
              : 'bg-amber-500 animate-pulse'
              }`} />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
              {JSON.stringify({ nodes, edges }) === localStorage.getItem(`build-hash-${projectId}`) ? 'Stored' : 'Modified'}
            </span>
          </div>
          {selectedNode && (
            <button onClick={handleSaveComponent} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all">
              <BookmarkPlus className="h-3.5 w-3.5" /> Remix Block
            </button>
          )}
          <button onClick={() => executeAction("Validate logic", false)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1.5 rounded-lg border border-rose-500/30 transition-all">
            <HeartPulse className="h-3.5 w-3.5" /> Check Health
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button onClick={() => setViewMode('graph')} className={`p-1.5 rounded transition-colors ${viewMode === 'graph' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Box className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('code')} disabled={Object.keys(files).length === 0} className={`p-1.5 rounded transition-colors ${viewMode === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white disabled:opacity-30'}`}><Terminal className="h-4 w-4" /></button>
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-1.5 rounded transition-colors ${isChatOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><MessageSquare className="h-4 w-4" /></button>
            <button onClick={() => setIsOutputOpen(!isOutputOpen)} className={`p-1.5 rounded transition-colors ${isOutputOpen ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Terminal className="h-4 w-4" /></button>
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button onClick={() => { setIsDeviceOpen(!isDeviceOpen); setDeviceType('mobile'); }} className={`p-1.5 rounded transition-colors ${deviceType === 'mobile' && isDeviceOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><Smartphone className="h-4 w-4" /></button>
            <button onClick={() => { setIsDeviceOpen(!isDeviceOpen); setDeviceType('desktop'); }} className={`p-1.5 rounded transition-colors ${deviceType === 'desktop' && isDeviceOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><Monitor className="h-4 w-4" /></button>
          </div>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button onClick={handleRunClick} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"><Play className="h-4 w-4 fill-current" /> Run App</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button>
        </div>
      </div>

      <div className="flex flex-1 h-full overflow-hidden relative">
        {/* LEFT SIDEBAR */}
        <div className="flex flex-col border-r border-slate-800 bg-slate-900 shrink-0 transition-all duration-300 ease-in-out" style={{ width: leftWidth }}>
          <div className="flex bg-slate-950 p-1.5 m-2 rounded-xl gap-1 border border-slate-800 shrink-0 shadow-inner">
            <button onClick={() => setSidebarTab('nodes')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${sidebarTab === 'nodes' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Box className="h-3 w-3 inline mr-2" /> Nodes</button>
            <button onClick={() => setSidebarTab('files')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${sidebarTab === 'files' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Folder className="h-3 w-3 inline mr-2" /> Files ({Object.keys(files).length})</button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {sidebarTab === 'nodes' ? (
              <div className="h-full overflow-y-auto">
                <Sidebar savedComponents={savedComponents} />
              </div>
            ) : (
              <FileExplorer
                files={files}
                activeFile={activeFile}
                onSelect={(f: string) => { setActiveFile(f); setViewMode('code'); }}
                onDownload={downloadProject}
                onSave={handleSave}
                // NEW: These props trigger the button in the FileExplorer
                onApprove={handleApproveAndExport}
                isPreviewMode={Object.keys(files).length === 1 && !!files['index.html']}
              />
            )}
          </div>

          {isChatOpen && (
            <div className="flex flex-col border-t border-slate-800 bg-slate-900/50">
              <ResizeHandle direction="vertical" onMouseDown={startResizing('y', setChatHeight, true)} />
              <div style={{ height: chatHeight }} className="shrink-0">
                <ChatPanel
                  isOpen={true}
                  onClose={() => setIsChatOpen(false)}
                  onSendMessage={(msg) => executeAction(msg, false)}
                />
              </div>
            </div>
          )}
        </div>

        <ResizeHandle direction="horizontal" onMouseDown={startResizing('x', setLeftWidth)} />

        {/* CENTER WORKSPACE (Restored ReactFlow + Background Grid) */}
        <div className="flex-1 h-full relative flex flex-col min-w-0" ref={wrapperRef}>
          <div className="flex-1 relative">
            {viewMode === 'graph' ? (
              <>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onPaneClick={onPaneClick}
                  onNodeDrag={onNodeDrag}
                  onNodeDragStop={onNodeDragStop}
                  fitView
                  colorMode="dark"
                  // 1. Dynamic class for the global cursor override
                  className={cursorMode === 'eraser' ? 'eraser-mode' : ''}
                  // 2. Base styles for performance
                  style={{
                    willChange: 'transform',
                    // Fallback inline cursor
                    cursor: cursorMode === 'eraser' ? 'crosshair' : 'default'
                  }}
                  nodeTypes={nodeTypes}
                >
                  <Background color="#334155" gap={24} variant={BackgroundVariant.Dots} />
                  <Controls className="bg-slate-800 border-slate-700 fill-slate-300 mb-2" />
                </ReactFlow>
                {/* TRASH AREA */}
                <div ref={trashRef} className={`absolute bottom-6 right-6 p-4 rounded-xl border-2 transition-all z-50 flex items-center gap-3 backdrop-blur-sm ${isTrashActive ? 'bg-red-500/20 border-red-500 scale-110 shadow-lg' : 'bg-slate-900/50 border-slate-700 text-slate-500'}`}>
                  <Trash2 className="h-6 w-6" /><span className="text-xs font-bold">Trash</span>
                </div>
                {(selectedNode || selectedEdge) && (
                  <div className="absolute top-4 right-4 z-[100]">
                    <Inspector selectedNode={selectedNode} selectedEdge={selectedEdge} setNodes={setNodes} setEdges={setEdges} onClose={() => { setSelectedNode(null); setSelectedEdge(null); }} />
                  </div>
                )}
              </>
            ) : (
              <CodeEditor
                filename={activeFile}
                code={files[activeFile] || ""}
                onChange={(c: string) => setFiles({ ...files, [activeFile]: c })}
                onSave={handleSave}
                onClose={() => setViewMode('graph')}
              />
            )}
          </div>

          {/* CONSOLE (Restored) */}
          {isOutputOpen && (
            <div className="flex flex-col border-t border-slate-800 bg-slate-950">
              <ResizeHandle direction="vertical" onMouseDown={startResizing('y', setConsoleHeight, true)} />

              {/* TAB NAVIGATION */}
              <div className="flex items-center px-4 h-10 border-b border-slate-900 bg-slate-900/50 gap-4 shrink-0">
                {['console', 'plan', 'images', 'prompt'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setOutputTab(tab as any)}
                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${outputTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ height: consoleHeight }} className="overflow-y-auto p-4 custom-scrollbar">
                {/* 1. CONSOLE TAB */}
                {outputTab === 'console' && <OutputPanel
                  isOpen={isOutputOpen}
                  logs={logs}
                  onClose={() => setIsOutputOpen(false)}
                  onClear={clearLogs}
                />}

                {/* 2. PLAN / TEXT OUTPUT TAB */}
                {outputTab === 'plan' && (
                  <div className="flex flex-col h-full">
                    {/* Analysis Text Area */}
                    <div className="flex-1 prose prose-invert max-w-none text-slate-300 font-mono text-sm p-4 overflow-y-auto">
                      {textOutput || (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
                          <FileText className="mb-2 opacity-20" size={40} />
                          <p>No analysis generated yet. Run the app to see details.</p>
                        </div>
                      )}
                    </div>

                    {/* THE APPROVAL ACTION BAR */}
                    {/* Change: Show this if index.html exists, meaning we have a preview to approve */}
                    {files['index.html'] && (
                      <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between sticky bottom-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Stage 1: Preview Active</span>
                          <span className="text-[9px] text-slate-600 font-medium">Ready for production scaffold?</span>
                        </div>

                        <button
                          onClick={handleApproveAndExport}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
                        >
                          <Box size={14} className="group-hover:rotate-12 transition-transform" />
                          APPROVE & BUILD PROJECT
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. IMAGE GALLERY TAB */}
                {outputTab === 'images' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imageOutputs.map((url, i) => (
                      <div key={i} className="group relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                        <img src={url} alt="AI Generation" className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                        <button onClick={() => window.open(url)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">View Full</button>
                      </div>
                    ))}
                    {imageOutputs.length === 0 && <p className="text-slate-500 text-xs italic col-span-full">No images generated.</p>}
                  </div>
                )}

                {/* 4. PROMPT TAB */}
                {outputTab === 'prompt' && (
                  <div className="h-full p-4 overflow-y-auto w-full">
                    <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                      {promptOutput || "No prompt generated yet. Run the flow to see the AI instructions."}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR PREVIEW */}
        {isDeviceOpen && <ResizeHandle direction="horizontal" onMouseDown={startResizing('x', setRightWidth, true)} />}
        {isDeviceOpen && (
          <div style={{ width: rightWidth }} className="shrink-0 h-full relative bg-slate-900 border-l border-slate-800">
            <DeviceSimulator
              isOpen={isDeviceOpen} onClose={() => setIsDeviceOpen(false)}
              generatedCode={files['index.html'] ? files['index.html'].replace('</head>', `<style>${files['styles.css'] || ''}</style></head>`).replace('</body>', `<script>${files['app.js'] || ''}</script></body>`) : null}
              loading={isGenerating} deviceType={deviceType}
            />
          </div>
        )}
      </div>
    </div>
  );
}
export default function EditorPage() { return <ReactFlowProvider><FlowEditor /></ReactFlowProvider>; }