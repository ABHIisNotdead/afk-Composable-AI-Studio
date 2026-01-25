import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  // IMPORTANT: Move this to .env.local for the actual hackathon!
  const apiKey = "AIzaSyAlK1wJAd6aq8lX3UNeam-wIQU2odfIZd0"; 

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

    // 3. PIPELINE TRAVERSAL (Logic Path)
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

   // 4. AI CONFIGURATION
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview", // UPDATED: Correct model name
        generationConfig: { responseMimeType: "application/json" } 
    });

    // 5. SMART MODE SWITCHING
    let systemInstruction = "";
    
    if (isRunCommand) {
        const isExport = lowerMsg.includes('approve') || lowerMsg.includes('export') || lowerMsg.includes('scaffold');

        if (isExport) {
            const techReqs = projectStack.language.toLowerCase().includes('android') 
                ? "Generate an Android Studio project structure: Include build.gradle, AndroidManifest.xml, and src/main/java folders."
                : "Generate a VS Code project: Include package.json, index.html, and a src/ folder.";

            systemInstruction = `
                You are a Lead Software Architect.
                TASK: Generate a PRODUCTION project scaffold for ${projectStack.language}.
                ${techReqs}

                JSON OUTPUT STRUCTURE:
                {
                    "type": "scaffold",
                    "message": "Full project scaffolded.",
                    "files": { "README.md": "...", "src/main.js": "..." },
                    "text": "Technical summary."
                }
            `;
        } else {
            // PREVIEW MODE - This now includes the Android "Fit to Screen" fix
            systemInstruction = `
                You are a UI Designer.
                TASK: Generate a high-fidelity standalone HTML preview.
                
                CRITICAL FOR MOBILE: You MUST include this meta tag in the <head>:
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                
                Also include this CSS to ensure it fits your Simulator:
                <style>
                    body { margin: 0; padding: 0; overflow-x: hidden; width: 100vw; }
                    #preview-banner { font-size: 10px !important; padding: 8px !important; }
                </style>

                BANNER REQUIREMENT:
                <div id="preview-banner" style="background: #4f46e5; color: white; text-align: center; padding: 12px; font-family: sans-serif; font-weight: bold; width: 100%;">
                    PROTOTYPE PREVIEW: Click "APPROVE" in sidebar for full code.
                </div>

                JSON OUTPUT STRUCTURE:
                {
                    "type": "preview",
                    "standaloneFile": "<!DOCTYPE html>...",
                    "text": "Overview."
                }
            `;
        }
    } else {
        systemInstruction = `You are a Technical Consultant. Analyze: ${pipelineSteps.map(s => s.label).join(' -> ')}.
        JSON OUTPUT: { "type": "chat", "message": "Feedback...", "text": "Analysis..." }`;
    }

    const result = await model.generateContent(systemInstruction + `\nUSER MESSAGE: ${userMessage}`);
    const resultText = result.response.text().trim();

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error("Route Error:", error);
    return NextResponse.json({ result: JSON.stringify({ type: "chat", message: "Error in generation. Check graph connections." }) });
  }
}