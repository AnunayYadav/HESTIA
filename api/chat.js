// api/chat.js
// Vercel Serverless Function correctly utilizing global fetch (No dependencies needed)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { persona, message, specialistName, role } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
    }

    if (!message || !specialistName) {
        return res.status(400).json({ error: 'Incomplete parameters: [message, specialistName] required.' });
    }

    try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `SYSTEM INSTRUCTION: You are ${specialistName}, the ${role} in the HESTIA World Government simulation. 
                    ${persona} 
                    Speak strictly in your persona. Be concise, professional, and immersive. 
                    USER MESSAGE: ${message}` }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API Error Response:', errorText);
            return res.status(502).json({ error: 'Neural bridge disruption in Gemini API.', details: errorText });
        }

        const data = await geminiResponse.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) {
            return res.status(502).json({ error: 'Neural bridge provided an empty signal.' });
        }

        return res.status(200).json({ text: aiText });
    } catch (err) {
        console.error('Internal Server Error:', err);
        return res.status(500).json({ error: 'Secure channel dropped unexpectedly during neural transfer.' });
    }
}
