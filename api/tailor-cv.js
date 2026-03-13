const https = require('https');

function httpsPost(url, data, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Length': Buffer.byteLength(body), ...headers }
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = { hostname: urlObj.hostname, path: urlObj.pathname, method: 'GET', headers };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on('error', reject);
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
    const authStr = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await httpsPost(
      'https://api-m.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${authStr}` }
    );
    const token = tokenRes.body.access_token;
    const orderRes = await httpsGet(
      `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}`,
      { 'Authorization': `Bearer ${token}` }
    );
    const validStatuses = ['COMPLETED', 'APPROVED'];
    if (!validStatuses.includes(orderRes.body.status)) {
      console.error('Unexpected PayPal order status:', orderRes.body.status);
      return res.status(402).json({ error: `Payment not completed (status: ${orderRes.body.status})` });
    }
  } catch (err) {
    console.error('PayPal error:', err);
    return res.status(402).json({ error: 'Payment verification failed' });
  }

  // Call Anthropic
  try {
    const anthropicRes = await httpsPost(
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

    const tailoredCV = anthropicRes.body.content[0].text;
    return res.status(200).json({ tailoredCV });
  } catch (err) {
    console.error('Anthropic error:', err);
    return res.status(500).json({ error: 'Failed to tailor CV' });
  }
};
