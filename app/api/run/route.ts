import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  // --- PASTE YOUR API KEY HERE ---
  const apiKey = "AIzaSyAmsR4_i9F5CXU5p1CCr6J3LYqjlk_S3IE";
  // -------------------------------

  try {
    const { nodes, edges, userMessage } = await request.json();

    // 1. FIND THE NODES
    // We look for the "AI Node" (the one doing the work)
    // In a real graph, we would traverse edges. For now, we find the node connected to Input.
    const inputNode = nodes.find((n: any) => n.type === 'input');
    const connectedEdge = edges.find((e: any) => e.source === inputNode?.id);
    const aiNode = nodes.find((n: any) => n.id === connectedEdge?.target);

    // 2. GET THE PROMPT TEMPLATE
    // If no AI node is connected, we use a default.
    let systemPrompt = aiNode?.data?.prompt || "You are a helpful assistant.";

    // 3. VARIABLE INJECTION (The Logic Engine) 🧠
    // We replace "{{input}}" with the actual message from the simulator.
    // If the user didn't use {{input}}, we append the message at the end (Chatbot style).
    let finalPrompt = "";

    if (systemPrompt.includes('{{input}}')) {
      // Template Mode: "Write a story about {{input}}"
      finalPrompt = systemPrompt.replace(/{{input}}/g, userMessage);
    } else {
      // Chat Mode: System Prompt + User Message
      finalPrompt = `
        SYSTEM INSTRUCTIONS: ${systemPrompt}
        
        USER REQUEST: ${userMessage}
      `;
    }

    // 4. FORCE HTML GENERATION (If in App Builder Mode)
    // We wrap the prompt with strict rules to ensure the Simulator can render it.
    const wrapperPrompt = `
      You are an expert UI Generator. 
      Your task is to generate valid HTML/Tailwind CSS based on the following request.
      
      REQUEST: "${finalPrompt}"
      
      RULES:
      1. Return ONLY the HTML code. No markdown, no conversational text.
      2. Use <script src="https://cdn.tailwindcss.com"></script>.
      3. Make it mobile-responsive.
    `;

    // 5. EXECUTE AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent(wrapperPrompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup
    text = text.replace(/```html/g, '').replace(/```/g, '');

    return NextResponse.json({ result: text });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}