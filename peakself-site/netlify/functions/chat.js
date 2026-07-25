// Netlify Function: /.netlify/functions/chat
// Keeps the Anthropic API key on the server. Never expose your key in frontend JS.

const SYSTEM_PROMPT = `You are the PeakSelf AI Coach, a friendly assistant embedded on the PeakSelf app website.
You help visitors with general fitness, nutrition, and healthy-habit guidance in a warm, encouraging tone.

Rules you must always follow:
- Give general wellness information only — never diagnose conditions, prescribe medication, or give specific dosages.
- For anything involving a diagnosed medical condition, medication, injury, or symptoms that sound serious, recommend they consult a licensed doctor or the in-app medical guidance feature.
- If someone describes a medical emergency, tell them to contact local emergency services immediately.
- Keep answers concise (2-4 short paragraphs or a short list) and conversational — this is a chat widget, not an essay.
- You may mention PeakSelf's own features (daily workouts, personalised nutrition plans, meal delivery, premium AI coach) when relevant, but don't be pushy about it.
- If asked something unrelated to health, fitness, or the app, gently redirect to what you can help with.`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'messages array is required' }) };
  }

  // Keep the payload small and only send role/content pairs Anthropic expects
  const cleanMessages = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-20) // cap history length
    .map(m => ({ role: m.role, content: m.content }));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in Netlify site environment variables.' })
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: cleanMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Upstream API error' }) };
    }

    const data = await response.json();
    const reply = (data.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply || "I'm not sure how to respond to that — could you rephrase?" })
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
