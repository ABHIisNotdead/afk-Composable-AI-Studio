import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const { nodes, edges, userMessage, files, isRunCommand } = await request.json();

        const lowerMsg = userMessage.toLowerCase().trim();
        if (['hi', 'hello', 'hey'].includes(lowerMsg)) {
            return NextResponse.json({
                result: JSON.stringify({
                    type: "chat",
                    message: "Architect standing by. Ready to build your project or provide technical advice."
                })
            });
        }

        // 2. BUILD EXECUTION CHAIN (Topological-ish Sort)
        // Find Start Node
        const startNode = nodes.find((n: any) => n.data?.type === 'start' || n.type === 'input');

        let executionSteps: any[] = [];
        let currentNode = startNode;
        const visited = new Set();

        if (currentNode) {
            while (currentNode && !visited.has(currentNode.id)) {
                visited.add(currentNode.id);

                executionSteps.push({
                    id: currentNode.id,
                    label: currentNode.data?.label || "Task",
                    instruction: currentNode.data?.prompt || "Pass through",
                    type: currentNode.data?.type || "generic"
                });

                // Find valid outgoing edge
                const edge = edges.find((e: any) => e.source === currentNode.id);
                if (edge) {
                    currentNode = nodes.find((n: any) => n.id === edge.target);
                } else {
                    currentNode = null;
                }
            }
        } else {
            // Fallback for non-connected graphs: Just take all nodes
            executionSteps = nodes.map((n: any) => ({
                id: n.id,
                label: n.data?.label || "Task",
                instruction: n.data?.prompt || "",
                type: n.data?.type
            }));
        }

        // 3. CONSTRUCT CHAIN-OF-THOUGHT PROMPT
        let chainPrompt = `
    You are an AI Build Engine. Your goal is to execute a pipeline of tasks sequentially to build a web application.
    
    CURRENT PROJECT STATE (Files):
    ${files && Object.keys(files).length > 0 ? JSON.stringify(files, null, 2) : "No files generated yet (clean slate)."}

    EXECUTION PIPELINE:
    `;

        executionSteps.forEach((step, index) => {
            chainPrompt += `
        STEP ${index + 1} [${step.label}]:
        - Instruction: "${step.instruction}"
        - Input: ${index === 0 ? "Initial User Request" : `Output from STEP ${index}`}
        - Action: Execute this instruction using the context from the previous step.
        `;
        });

        chainPrompt += `
    
    FINAL GOAL:
    Based on the FINAL OUTPUT of the pipeline above, generate the complete source code for the application.
    `;

        // 4. AI CONFIGURATION
        if (!apiKey) {
            return NextResponse.json({
                result: JSON.stringify({ type: "chat", message: "Error: GEMINI_API_KEY is missing in environment variables." })
            }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        let systemInstruction = "";

        if (isRunCommand) {
            const isExport = lowerMsg.includes('approve') || lowerMsg.includes('export') || lowerMsg.includes('scaffold');

            if (isExport) {
                systemInstruction = `
              Role: Lead Software Architect.
              Task: Generate a multi-file production scaffold based on the pipeline.
              ${chainPrompt}
              
              Output Format (JSON):
              {
                "type": "scaffold",
                "message": "Scaffold created successfully.",
                "files": {
                  "package.json": "...",
                  "README.md": "...",
                  "src/App.tsx": "..."
                }
              }
            `;
            } else {
                // Advanced Architect Prompt for Prototype Generation
                systemInstruction = `
              You are an expert Senior Software Architect and Full-Stack Developer.
              Your goal is to build high-quality, production-ready web applications based on a node-based flow diagram.

              CONTEXT:
              ${chainPrompt}

              **PROCESS OVERVIEW (The "Thinking" Phase):**
              1. **Analyze**: Understand the user's intent, the node flow, and the required features.
              2. **Architect**: Decide on the best Tech Stack (default: HTML + TailwindCSS + Vanilla JS for portability, unless specified otherwise).
              3. **Plan Files**: Determine the exact file structure needed (index.html, styles.css, app.js, etc.).
              4. **Implement**: Generate the actual code for every file.

              **CRITICAL OUTPUT FORMAT:**
              You MUST return a SINGLE VALID JSON object. Do not include markdown formatting (like \`\`\`json) outside the JSON.
              
              JSON Structure:
              {
                  "type": "chat" | "preview",
                  "message": "Short status message for the user.",
                  "thinking": "## Architecture Plan\\n- **Language**: HTML5, TailwindCSS, ES6 JavaScript\\n- **Approach**: ...\\n- **Files**: index.html, ...",
                  "files": {
                      "index.html": "<!DOCTYPE html>...",
                      "styles.css": "body { ... }",
                      "app.js": "console.log('...')"
                  },
                  "standaloneFile": "<!DOCTYPE html><html>... (Full bundled code for preview) ...</html>"
              }

              **RULES:**
              - **"thinking"**: This field is MANDATORY. Write a markdown analysis of your plan here. Explain your stack choice and file structure.
              - **"standaloneFile"**: If the app can be a single file (HTML+CSS+JS in one), put it here. This is CRITICAL for the "Live Output" preview.
              - **"files"**: If multiple files are better, list them here.
              - **Responsive**: All designs MUST be mobile-responsive.
              - **Styling**: Use TailwindCSS via CDN (https://cdn.tailwindcss.com) for reliable styling.
              
              Now, generate the logical solution.
            `;
            }
        } else {
            systemInstruction = `
          Role: AI Consultant.
          Task: Analyze the pipeline.
          ${chainPrompt}
          Output Format (JSON):
          {
            "type": "chat",
            "message": "Analysis: Step 1 will..."
          }
        `;
        }

        // 5. ROBUST GENERATION WITH RETRY (Prevent "Empty Response" & "Overload")
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        let resultText = "";
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount <= maxRetries) {
            try {
                const result = await model.generateContent(`${systemInstruction}\n\nUSER REQUEST: ${userMessage}`);

                // Safety check for candidates
                if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
                    // If blocked or empty, treats as a temporary failure if we have retries left?
                    // Usually blocked means safety filter.
                    console.warn("AI returned no candidates. Possibly blocked.");
                }

                resultText = result.response.text();
                // If we get here and have text, we are good.
                if (resultText && resultText.trim().length > 0) {
                    resultText = resultText.trim();
                    break;
                }
            } catch (genError: any) {
                console.error(`Attempt ${retryCount + 1} error:`, genError.message);

                // Retry only on specific transient errors
                if (genError.message?.includes("503") || genError.message?.includes("429") || genError.message?.includes("Overloaded")) {
                    retryCount++;
                    if (retryCount > maxRetries) {
                        throw new Error(`AI Service Overloaded after ${maxRetries} retries. Please try again later.`);
                    }
                    await delay(2000 * Math.pow(2, retryCount)); // Exponential Backoff: 4s, 8s, 16s...
                    continue;
                } else {
                    // Non-retriable error (e.g. invalid key, bad request)
                    throw genError;
                }
            }
            // If we didn't throw but got empty text, maybe retry or just fail? 
            // Usually generateContent throws if it can't generate text.
            retryCount++;
        }

        if (!resultText) {
            // Fallback JSON if AI completely fails to generate text but didn't throw
            return NextResponse.json({
                result: JSON.stringify({
                    type: "chat",
                    message: "AI returned an empty response. It might be blocked by safety settings or network issues.",
                    debugPrompt: `${systemInstruction}\n\nUSER REQUEST: ${userMessage}`
                })
            });
        }

        // Parse the result to inject debug info if it's a JSON string
        try {
            // We aim to inject 'debugPrompt' into the returned JSON *logic* if possible
            // But the resultText is just a string from AI. 
            // The frontend parses it. 
            // Better approach: We wrap the result in our own envelope? 
            // Current Frontend expects { result: "..." } where "..." is the AI text.
            // If we change that, we break frontend parsing logic which does JSON.parse(data.result).
            // So we can try to inject it into the AI's JSON output if it's valid JSON? 
            // OR simpler: output it as a separate field in the top-level response.

            return NextResponse.json({
                result: resultText,
                debugPrompt: `${systemInstruction}\n\nUSER REQUEST: ${userMessage}`
            });
        } catch (e) {
            return NextResponse.json({ result: resultText });
        }

    } catch (error: any) {
        console.error("Route Error:", error);
        return NextResponse.json({ result: JSON.stringify({ type: "chat", message: `Generation error: ${error.message}` }) });
    }
}