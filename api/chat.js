const fetch = require('node-fetch');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { persona, message, specialistName, role } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured in Vercel environment' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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

        const data = await response.json();
        
        if (data.error) {
            console.error('Gemini API Error:', data.error);
            return res.status(500).json({ error: 'Neural bridge disruption.', details: data.error.message });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text: aiText });
    } catch (err) {
        console.error('Server side error:', err);
        return res.status(500).json({ error: 'Secure channel dropped unexpectedly.' });
    }
}
