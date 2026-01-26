import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  // Use the Key name you entered in the Vercel Dashboard
  const apiKey = process.env.GEMINI_SYSTEM_PROMPT;

  try {
    const { nodes, edges, userMessage, isRunCommand } = await request.json();

    // 1. GREETING GUARDRAIL
    const lowerMsg = userMessage.toLowerCase().trim();
    if (['hi', 'hello', 'hey'].includes(lowerMsg)) {
        return NextResponse.json({ 
            result: JSON.stringify({
                type: "chat",
                message: "Architect standing by. Ready to build your project or provide technical advice."
            })
        });
    }

    // 2. MODULAR CONFIG EXTRACTION
    const langNode = nodes.find((n: any) => n.data?.type === 'prog-lang');
    const dbNode = nodes.find((n: any) => n.data?.type === 'database');
    const startNode = nodes.find((n: any) => n.data?.type === 'start' || n.type === 'input');

    const projectStack = {
        language: langNode?.data?.prompt || "Standard HTML/Tailwind",
        database: dbNode?.data?.prompt || "LocalStorage/None"
    };

    // 3. PIPELINE TRAVERSAL
    let pipelineSteps = [];
    let currentNode = startNode;
    const visited = new Set();
    
    while (currentNode && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      pipelineSteps.push({
        label: currentNode.data?.label || "Step",
        prompt: currentNode.data?.prompt || "",
        type: currentNode.data?.type || currentNode.type
      });
      const edge = edges.find((e: any) => e.source === currentNode.id);
      currentNode = edge ? nodes.find((n: any) => n.id === edge.target) : null;
    }

    // 4. AI CONFIGURATION (FIXED: Added check for apiKey)
    if (!apiKey) {
        return NextResponse.json({ 
            result: JSON.stringify({ type: "chat", message: "Error: API Key is missing in Vercel settings." }) 
        }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", 
        generationConfig: { responseMimeType: "application/json" } 
    });

    // 5. SYSTEM INSTRUCTIONS
    let systemInstruction = "";
    if (isRunCommand) {
        const isExport = lowerMsg.includes('approve') || lowerMsg.includes('export') || lowerMsg.includes('scaffold');
        if (isExport) {
            systemInstruction = `Lead Architect. Generate scaffold for ${projectStack.language}. Output JSON: { "type": "scaffold", "files": {...}, "text": "..." }`;
        } else {
            systemInstruction = `UI Designer. Generate HTML preview. Output JSON: { "type": "preview", "standaloneFile": "...", "text": "..." }`;
        }
    } else {
        systemInstruction = `Consultant. Analyze: ${pipelineSteps.map(s => s.label).join(' -> ')}. JSON: { "type": "chat", "message": "..." }`;
    }

    const result = await model.generateContent(systemInstruction + `\nUSER MESSAGE: ${userMessage}`);
    const resultText = result.response.text().trim();

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json({ result: JSON.stringify({ type: "chat", message: "Generation error." }) });
  }
}