# AuditPilot

**Forensic Financial Intelligence — Upload a spreadsheet, get a fraud risk report.**

AuditPilot is an open-source forensic accounting tool that applies Benford's Law, the Beneish M-Score, 30+ financial ratios, and AI-powered narrative analysis to detect earnings manipulation and red flags in corporate financial statements. Upload a CSV of annual financials, and AuditPilot generates a comprehensive risk report with PDF export — no backend required.

---

## Screenshots

![Dashboard](screenshots/dashboard.png)
![Timeline Analysis](screenshots/timeline.png)
![PDF Report](screenshots/report.png)

---

## Features

- **Benford's Law Analysis** — First-digit frequency test across revenue, expenses, and other line items with chi-square significance testing
- **Beneish M-Score** — Eight-factor model for detecting earnings manipulation; flags companies likely to be manipulators
- **30+ Financial Ratios** — Liquidity, leverage, profitability, efficiency, and cash flow quality ratios with year-over-year trend tracking
- **Red Flag Detection** — Automated rule-based alerts for anomalies like revenue/cash flow divergence, accruals spikes, and DSO deterioration
- **AI Narrative Report** — LLM-generated executive summary via OpenRouter, synthesizing all findings into a structured risk assessment
- **PDF Export** — One-click export of the full analysis report
- **Trend Analysis** — Interactive normalized multi-metric timeline chart with statistical outlier detection

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **AI:** OpenRouter API (any compatible LLM)
- **Stats:** jStat
- **Icons:** Lucide React

---

## Quick Start

```bash
git clone https://github.com/your-username/auditpilot.git
cd auditpilot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Setup

Create a `.env.local` file in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Get a free API key at [openrouter.ai](https://openrouter.ai). The AI report feature requires this key; all other analysis runs entirely client-side.

---

## Demo

The app ships with pre-loaded **Enron Corporation** financials (1996–2001). Click **"Load Demo Data"** on the upload screen to instantly explore a real-world fraud case — no file upload needed.

---

## License

MIT

---

_Built for the [GitHub Octoverse Hackathon](https://github.blog/)_
