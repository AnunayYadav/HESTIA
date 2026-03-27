// api/chat.js
// Enhanced Neural Gateway with CORS support and robust error handling

export default async function handler(req, res) {
  // 🛡️ Implementation of CORS Headers from previous successful protocols
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 📡 Handle Preflight Request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 🚫 Method Gate
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST for neural synchronization." });
  }

  // 🔑 Key Management
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
        error: "Gateway configuration missing: GEMINI_API_KEY environment variable not found on Vercel.",
        type: "CONFIG_ERROR"
    });
  }

  try {
    const { specialistName, role, persona, message } = req.body || {};

    if (!message || !specialistName) {
        return res.status(400).json({ error: "Neural bridge requires [message] and [specialistName]. Protocol aborted." });
    }

    // 🏎️ Direct Neural Call (Switching to 2.5-flash to resolve 404/429)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `SYSTEM INSTRUCTION: You are ${specialistName}, the ${role} in the HESTIA World Government simulation. 
                ${persona} 
                Speak strictly in your persona. Be concise, professional, and immersive. 
                USER MESSAGE: ${message}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 500,
            }
        })
    });

    const data = await response.json();

    // 🛠️ Error Response Handling (Matching your previous project's logic)
    if (!response.ok) {
        const errorMsg = data.error?.message || "Unknown neural bridge failure.";
        const status = response.status;

        // 🚦 Handle Rate Limits (429)
        if (status === 429 || errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("rate limit")) {
            res.setHeader('Retry-After', '60');
            return res.status(429).json({
                error: "Google Gemini Quota Exhausted: The system is under heavy load or the free-tier limit has been reached. Please try again in 60 seconds.",
                type: "RATE_LIMIT",
                rawError: errorMsg
            });
        }

        // 📉 Handle Overload (503)
        if (status === 503 || errorMsg.toLowerCase().includes("overloaded")) {
            return res.status(503).json({
                error: "AI Engine Overloaded: Google's servers are temporarily unable to process this request. Please try again shortly.",
                type: "SERVER_OVERLOAD"
            });
        }

        return res.status(status).json({ 
            error: "Neural bridge disruption.", 
            details: errorMsg,
            status: status
        });
    }

    // ✨ Success Response
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) {
        return res.status(502).json({ error: "The AI node returned an empty signal. Check model availability." });
    }

    return res.status(200).json({ text: aiText });

  } catch (error) {
    const errorMsg = error.message || String(error);
    console.error('SERVER_BRIDGE_FATAL:', errorMsg);

    return res.status(500).json({
      error: "Intelligence Gateway Error: An unexpected failure occurred in the AI bridge.",
      details: errorMsg
    });
  }
}
