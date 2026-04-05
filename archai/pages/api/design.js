export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { description } = req.body;
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ error: 'Please provide a more detailed app description.' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured.' });
  }
  const prompt = `You are an expert software architect. A user wants a complete system design for their app.

App Description: "${description.trim().slice(0, 1000)}"

Generate a comprehensive system design as a JSON object with EXACTLY this structure:
{
  "appName": "Short catchy name for the app (2-4 words)",
  "architectureType": "One of: Microservices, Monolithic, Event-Driven, Serverless, CQRS, Layered",
  "overview": "2-3 sentence summary of the architecture approach and why it fits this app",
  "mermaidDiagram": "A valid Mermaid flowchart diagram (flowchart TD) showing the main system components and their connections. Use simple node names without special characters.",
  "techStack": [
    { "category": "Frontend", "tech": "Technology name", "reason": "One sentence why" },
    { "category": "Backend", "tech": "Technology name", "reason": "One sentence why" },
    { "category": "Database", "tech": "Technology name", "reason": "One sentence why" },
    { "category": "Cache", "tech": "Technology name", "reason": "One sentence why" },
    { "category": "Auth", "tech": "Technology name", "reason": "One sentence why" },
    { "category": "Hosting", "tech": "Technology name", "reason": "One sentence why" }
  ],
  "keyAPIs": [
    { "method": "POST", "endpoint": "/api/example", "description": "What this endpoint does" },
    { "method": "GET", "endpoint": "/api/example/:id", "description": "What this endpoint does" },
    { "method": "PUT", "endpoint": "/api/example/:id", "description": "What this endpoint does" },
    { "method": "DELETE", "endpoint": "/api/example/:id", "description": "What this endpoint does" }
  ],
  "scalabilityFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "estimatedComplexity": "Low|Medium|High",
  "mvpTimeline": "e.g. 6-8 weeks"
}

Return ONLY valid JSON. No markdown, no explanation.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2048,
        temperature: 0.7
      })
    });
    if (!groqRes.ok) {
      const body = await groqRes.text();
      throw new Error(`Groq ${groqRes.status}: ${body.slice(0, 300)}`);
    }
    const data = await groqRes.json();
    const rawText = data.choices?.[0]?.message?.content?.trim();
    if (!rawText) throw new Error('Empty response from AI');
    let jsonText = rawText;
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();
    const design = JSON.parse(jsonText);
    const required = ['appName', 'architectureType', 'overview', 'mermaidDiagram', 'techStack', 'keyAPIs', 'scalabilityFeatures'];
    for (const field of required) {
      if (!design[field]) throw new Error(`Missing field: ${field}`);
    }
    return res.status(200).json(design);
  } catch (err) {
    console.error('[ArchAI]', err.message);
    return res.status(500).json({ error: err.message || 'Failed to generate design. Please try again.' });
  }
}
