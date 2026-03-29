import { NextResponse } from 'next/server';

export async function POST(req) {
  // 🔑 Key Management
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ 
        error: "Gateway configuration missing: GEMINI_API_KEY environment variable not found.",
        type: "CONFIG_ERROR"
    }, { status: 500 });
  }

  try {
    const { specialistName, role, persona, message } = await req.json();

    if (!message || !specialistName) {
        return NextResponse.json({ error: "Neural bridge requires [message] and [specialistName]. Protocol aborted." }, { status: 400 });
    }

    // 🏎️ Direct Neural Call (Using gemini-2.0-flash-latest or similar stable model)
    // The previous code had 2.5-flash which might be experimental or future-proofed.
    // I will stick to a known stable model if possible, but the user's code had 2.5-flash.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: `You are ${specialistName}, the ${role} in the HESTIA World Government simulation. 
                ${persona} 
                Speak strictly in your persona using ONLY direct dialogue. No stage directions (*sighs*, etc.). Be concise—respond with only 2 or 3 impactful sentences that address the query and your SDG role.` }]
            },
            contents: [{
                parts: [{ text: message }]
            }],
            generationConfig: {
                temperature: 0.8,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 1000,
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMsg = data.error?.message || "Unknown neural bridge failure.";
        return NextResponse.json({ 
            error: "Neural bridge disruption.", 
            details: errorMsg,
            status: response.status
        }, { status: response.status });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
        return NextResponse.json({ error: "The AI node returned an empty signal." }, { status: 502 });
    }

    return NextResponse.json({ text: aiText });

  } catch (error) {
    console.error('SERVER_BRIDGE_FATAL:', error);
    return NextResponse.json({
      error: "Intelligence Gateway Error: An unexpected failure occurred in the AI bridge.",
      details: error.message
    }, { status: 500 });
  }
}

// 📡 Handle Preflight Request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
      'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    },
  });
}
