import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cvText, jobDescription, paypalOrderId } = req.body;

  if (!cvText || !jobDescription || !paypalOrderId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Verify PayPal payment server-side
  try {
    const paypalAuthRes = await fetch(
      "https://api-m.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
            ).toString("base64"),
        },
        body: "grant_type=client_credentials",
      }
    );
    const { access_token } = await paypalAuthRes.json();

    const orderRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const order = await orderRes.json();

    if (order.status !== "COMPLETED") {
      return res.status(402).json({ error: "Payment not completed" });
    }
  } catch (err) {
    console.error("PayPal verification failed:", err);
    return res.status(402).json({ error: "Payment verification failed" });
  }

  // Call Anthropic API
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an expert CV/resume writer and career coach. Your task is to tailor the provided CV to match the given job description.

Instructions:
- Rewrite and reorder bullet points to highlight the most relevant experience
- Mirror keywords and phrases from the job description naturally
- Adjust the professional summary/objective to align with the role
- Keep ALL factual information accurate — do not invent experience
- Maintain the same general structure but optimize content
- Make it ATS-friendly by incorporating key terms from the job description
- Output ONLY the tailored CV in clean plain text, ready to copy-paste

---
JOB DESCRIPTION:
${jobDescription}

---
ORIGINAL CV:
${cvText}

---
TAILORED CV:`,
        },
      ],
    });

    const tailoredCV = message.content[0].text;
    return res.status(200).json({ tailoredCV });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "Failed to tailor CV" });
  }
}
