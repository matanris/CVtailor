# CV Tailor — Deployment Guide

A pay-per-use CV tailoring tool. Users pay $2.50 via PayPal to get their CV rewritten by AI to match a job description.

---

## Step 1 — Upgrade PayPal to Business (5 min)

1. Go to **paypal.com** and log in
2. Click your name → **Account Settings**
3. Under "Account type", click **Upgrade to Business account**
4. Fill in basic business info (you can use your own name as the business name)

---

## Step 2 — Get PayPal API Keys (5 min)

1. Go to **developer.paypal.com**
2. Log in with your PayPal credentials
3. Click **Apps & Credentials**
4. Make sure you're on **Live** tab (not Sandbox for real payments)
5. Click **Create App** → name it "CV Tailor" → Create
6. Copy your **Client ID** and **Secret** — you'll need both

---

## Step 3 — Get Anthropic API Key (2 min)

1. Go to **console.anthropic.com**
2. Click **API Keys** → **Create Key**
3. Copy the key (you won't see it again)
4. Add $5–10 credit to your account (Settings → Billing)
   - Each CV tailoring costs ~$0.03 in API credits
   - At $2.50/use you keep ~$2.20 profit per use

---

## Step 4 — Deploy to Vercel (10 min)

### 4a — Upload code to GitHub
1. Go to **github.com** → New repository → name it "cv-tailor" → Create
2. Upload all the files from this folder to the repository

### 4b — Connect to Vercel
1. Go to **vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your cv-tailor repo
3. Click **Deploy** (it will fail first — that's OK, we need env vars)

### 4c — Add environment variables
1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add these one by one:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | your PayPal Client ID |
| `PAYPAL_CLIENT_ID` | your PayPal Client ID |
| `PAYPAL_CLIENT_SECRET` | your PayPal Client Secret |

3. Click **Save**, then go to **Deployments** → **Redeploy**

### 4d — Get a domain (optional but recommended)
- Vercel gives you a free `.vercel.app` domain
- For a custom domain like `cvtailor.co`, buy one on **Namecheap** (~$10/yr) and connect it in Vercel's Domains settings

---

## Cost breakdown

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| Domain (optional) | ~$10/yr |
| Anthropic API per use | ~$0.03 |
| PayPal fee per use | ~$0.30 + 3.49% = ~$0.39 |
| **Your profit per use** | **~$2.08** |

---

## Getting your first customers

- Post on **r/jobs**, **r/resumes**, **r/careerguidance**
- Share on **LinkedIn** targeting job seekers
- List on **Product Hunt**
- Add to **IndieHackers**

---

## Files

```
cv-tailor/
├── pages/
│   ├── index.js          # Main UI
│   └── api/
│       └── tailor-cv.js  # Serverless function (Anthropic + PayPal verify)
├── .env.example          # Copy to .env.local for local dev
├── package.json
└── README.md
```
