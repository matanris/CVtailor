import { useState } from "react";
import Head from "next/head";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PRICE = "2.50";

export default function Home() {
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredCV, setTailoredCV] = useState("");
  const [status, setStatus] = useState("idle"); // idle | paying | processing | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const isReady = cvText.trim().length > 100 && jobDescription.trim().length > 50;

  const handleApprove = async (data) => {
    setStatus("processing");
    try {
      const res = await fetch("/api/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvText,
          jobDescription,
          paypalOrderId: data.orderID,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Something went wrong");
      setTailoredCV(result.tailoredCV);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tailoredCV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStatus("idle");
    setTailoredCV("");
    setErrorMsg("");
  };

  return (
    <>
      <Head>
        <title>CV Tailor — Land the Interview</title>
        <meta name="description" content="Tailor your CV to any job description in seconds using AI. Pay only when you use it." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0d0d0d;
          --bg2: #141414;
          --bg3: #1c1c1c;
          --border: #2a2a2a;
          --border-light: #333;
          --amber: #e8a838;
          --amber-dim: #c48920;
          --cream: #f0e6d0;
          --text: #d4cfc8;
          --text-dim: #7a756e;
          --green: #4caf7d;
          --red: #e05555;
        }

        html, body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        ::selection { background: var(--amber); color: #000; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg2); }
        ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 3px; }

        textarea {
          font-family: 'DM Mono', monospace;
          font-size: 12.5px;
          line-height: 1.7;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          padding: 16px;
          width: 100%;
          resize: vertical;
          transition: border-color 0.2s;
          outline: none;
        }
        textarea:focus { border-color: var(--amber-dim); }
        textarea::placeholder { color: var(--text-dim); }

        .btn-primary {
          background: var(--amber);
          color: #000;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: 15px;
          padding: 14px 28px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.01em;
        }
        .btn-primary:hover { background: #f0b848; }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { background: var(--border-light); color: var(--text-dim); cursor: not-allowed; }

        .btn-ghost {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          padding: 10px 20px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-ghost:hover { border-color: var(--amber); color: var(--amber); }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .animate-in { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <PayPalScriptProvider options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture"
      }}>
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Header */}
          <header style={{ marginBottom: 56, borderBottom: "1px solid var(--border)", paddingBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, color: "var(--cream)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                CV Tailor
              </h1>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--amber)", border: "1px solid var(--amber-dim)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.08em" }}>
                ${PRICE} / use
              </span>
            </div>
            <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.6, maxWidth: 520, fontWeight: 300 }}>
              Paste your CV and the job description. AI rewrites your CV to match — highlighting relevant experience, mirroring keywords, and passing ATS filters.
            </p>
          </header>

          {/* Done state */}
          {status === "done" && (
            <div className="animate-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--green)", letterSpacing: "0.05em" }}>TAILORED CV READY</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-ghost" onClick={handleCopy}>{copied ? "✓ Copied!" : "Copy to clipboard"}</button>
                  <button className="btn-ghost" onClick={handleReset}>← Tailor another</button>
                </div>
              </div>
              <textarea
                readOnly
                value={tailoredCV}
                rows={32}
                style={{ cursor: "text", borderColor: "var(--green)" }}
              />
            </div>
          )}

          {/* Processing state */}
          {status === "processing" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ width: 40, height: 40, border: "2px solid var(--border)", borderTop: "2px solid var(--amber)", borderRadius: "50%", margin: "0 auto 24px", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Tailoring your CV…</p>
              <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 8, opacity: 0.6 }}>This takes about 20–30 seconds</p>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div style={{ background: "#1a0f0f", border: "1px solid var(--red)", borderRadius: 8, padding: 24, marginBottom: 24 }}>
              <p style={{ color: "var(--red)", marginBottom: 16 }}>⚠ {errorMsg}</p>
              <button className="btn-ghost" onClick={handleReset}>Try again</button>
            </div>
          )}

          {/* Main form */}
          {(status === "idle" || status === "paying") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Left column */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: 10, textTransform: "uppercase" }}>
                  Your Current CV
                </label>
                <textarea
                  rows={22}
                  placeholder={"Paste your full CV here...\n\nInclude:\n• Work experience\n• Education\n• Skills\n• Any sections you normally include"}
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                />
                <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
                  {cvText.length > 0 ? `${cvText.length} chars` : "min. ~100 chars"}
                </p>
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ display: "block", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: 10, textTransform: "uppercase" }}>
                  Job Description
                </label>
                <textarea
                  rows={14}
                  placeholder={"Paste the full job description here...\n\nThe more detail, the better the tailoring."}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8, fontFamily: "'DM Mono', monospace" }}>
                  {jobDescription.length > 0 ? `${jobDescription.length} chars` : "min. ~50 chars"}
                </p>

                {/* How it works */}
                <div style={{ marginTop: 24, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
                  <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: 14, textTransform: "uppercase" }}>How it works</p>
                  {[
                    ["01", "Paste your CV and the job description"],
                    ["02", "Pay $2.50 securely via PayPal"],
                    ["03", "AI tailors your CV in ~30 seconds"],
                    ["04", "Copy the result and apply"],
                  ].map(([n, t]) => (
                    <div key={n} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--amber)", minWidth: 20 }}>{n}</span>
                      <span style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>{t}</span>
                    </div>
                  ))}
                </div>

                {/* Payment button */}
                <div style={{ marginTop: 20 }}>
                  {!isReady ? (
                    <button className="btn-primary" disabled style={{ width: "100%" }}>
                      Paste CV + Job Description to continue
                    </button>
                  ) : status === "idle" ? (
                    <button className="btn-primary" style={{ width: "100%" }} onClick={() => setStatus("paying")}>
                      Tailor my CV — Pay ${PRICE} →
                    </button>
                  ) : (
                    <div>
                      <p style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "'DM Mono', monospace", marginBottom: 12, textAlign: "center" }}>
                        Complete payment via PayPal
                      </p>
                      <PayPalButtons
                        style={{ layout: "vertical", shape: "rect", label: "pay" }}
                        createOrder={(data, actions) =>
                          actions.order.create({
                            purchase_units: [{ amount: { value: PRICE, currency_code: "USD" }, description: "CV Tailor — 1 tailored CV" }],
                          })
                        }
                        onApprove={(data, actions) =>
                          actions.order.capture().then(() => handleApprove(data))
                        }
                        onCancel={() => setStatus("idle")}
                        onError={() => { setErrorMsg("PayPal encountered an error. Please try again."); setStatus("error"); }}
                      />
                      <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setStatus("idle")}>← Go back</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "'DM Mono', monospace" }}>CV Tailor · Powered by Claude AI</span>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Payments secured by PayPal</span>
          </footer>
        </main>
      </PayPalScriptProvider>
    </>
  );
}
