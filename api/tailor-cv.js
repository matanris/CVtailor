const https = require('https');

function httpsRequest(method, url, data, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null;
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cvText, jobDescription, paypalOrderId } = req.body;
  if (!cvText || !jobDescription || !paypalOrderId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify PayPal payment
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Server config error: PayPal credentials not set in Vercel environment variables' });
    }

    const authStr = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Get access token
    const tokenRes = await httpsRequest(
      'POST',
      'https://api-m.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${authStr}` }
    );

    const token = tokenRes.body.access_token;
    if (!token) {
      const errMsg = tokenRes.body.error_description || tokenRes.body.error || JSON.stringify(tokenRes.body);
      return res.status(402).json({ error: `PayPal auth failed: ${errMsg}. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in Vercel.` });
    }

    // Get order
    const orderRes = await httpsRequest(
      'GET',
      `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}`,
      null,
      { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    );

    const status = orderRes.body.status;
    if (!['COMPLETED', 'APPROVED'].includes(status)) {
      return res.status(402).json({ error: `Payment verification failed (status: ${status || 'unknown'})` });
    }

  } catch (err) {
    return res.status(402).json({ error: 'PayPal verification error: ' + err.message });
  }

  // Call Anthropic
  try {
    const anthropicRes = await httpsRequest(
      'POST',
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are an expert CV/resume writer. Tailor the CV below to match the job description.

Instructions:
- Rewrite bullet points to highlight relevant experience
- Mirror keywords and phrases from the job description naturally
- Adjust the summary/objective to align with the role
- Keep ALL facts accurate — do not invent experience
- Make it ATS-friendly
- Output ONLY the tailored CV in clean plain text

---
JOB DESCRIPTION:
${jobDescription}

---
ORIGINAL CV:
${cvText}

---
TAILORED CV:`
        }]
      },
      {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    );

    const tailoredCV = anthropicRes.body.content?.[0]?.text;
    if (!tailoredCV) return res.status(500).json({ error: 'AI returned empty response' });
    return res.status(200).json({ tailoredCV });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to tailor CV: ' + err.message });
  }
};
