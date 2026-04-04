export default async function handler(req, res) {
      if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
            }

              const { description } = req.body;
                if (!description || typeof description !== 'string' || description.trim().length < 10) {
                    return res.status(400).json({ error: 'Please provide a more detailed app description.' });
                      }

                        if (!process.env.GEMINI_API_KEY) {
                            return res.status(500).json({ error: 'AI service not configured.' });
                              }

                                const prompt = `You are an expert software architect. A user wants a complete system design for their app.

                                App Description: "${description.trim().slice(0, 1000)}"

                                Generate a comprehensive system design as a JSON object with EXACTLY this structure:
                                {
                                  "appName": "Short catchy name for the app (2-4 words)",
                                    "architectureType": "One of: Microservices, Monolithic, Event-Driven, Serverless, CQRS, Layered, Hexagonal",
                                      "overview": "2-3 sentence summary of the architecture approach and why it fits this app",
                                        "mermaidDiagram": "A valid Mermaid flowchart diagram (flowchart TD) showing the main system components. Use simple node names. Include at least 6 nodes. Example: flowchart TD\\n  Client-->|HTTP|API\\n  API-->DB",
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
                                                                                      { "method": "DELETE", "endpoint": "/api/example/:id", "description": "What this endpoint does" },
                                                                                          { "method": "GET", "endpoint": "/api/example", "description": "What this endpoint does" }
                                                                                            ],
                                                                                              "scalabilityFeatures": [
                                                                                                  "Horizontal scaling strategy",
                                                                                                      "Caching strategy",
                                                                                                          "Database sharding or replication approach",
                                                                                                              "CDN usage",
                                                                                                                  "Load balancing approach",
                                                                                                                      "Queue/async processing"
                                                                                                                        ],
                                                                                                                          "estimatedComplexity": "Low | Medium | High",
                                                                                                                            "mvpTimeline": "X-Y weeks"
                                                                                                                            }

                                                                                                                            IMPORTANT: Return ONLY the JSON object, no markdown, no explanation`;

                                                                                                                              try {
                                                                                                                                  const geminiRes = await fetch(
                                                                                                                                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                                                                                                                                              {
                                                                                                                                                      method: 'POST',
                                                                                                                                                              headers: { 'Content-Type': 'application/json' },
                                                                                                                                                                      body: JSON.stringify({
                                                                                                                                                                                contents: [{ parts: [{ text: prompt }] }],
                                                                                                                                                                                          generationConfig: {
                                                                                                                                                                                                      maxOutputTokens: 2048,
                                                                                                                                                                                                                  temperature: 0.7,
                                                                                                                                                                                                                              responseMimeType: 'application/json',
                                                                                                                                                                                                                                        },
                                                                                                                                                                                                                                                }),
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                          );

                                                                                                                                                                                                                                                              if (!geminiRes.ok) {
                                                                                                                                                                                                                                                                    const body = await geminiRes.text();
                                                                                                                                                                                                                                                                          throw new Error(`Gemini ${geminiRes.status}: ${body.slice(0, 300)}`);
                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                  const data = await geminiRes.json();
                                                                                                                                                                                                                                                                                      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
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
}