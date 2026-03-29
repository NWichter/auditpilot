import { NextRequest, NextResponse } from "next/server";
import type { AnalysisResult } from "@/lib/types";

function buildPrompt(data: AnalysisResult): string {
  const { company, benford, beneish, redFlags, riskScore, ratios } = data;

  const criticalRatios = ratios.filter((r) => r.status === "red");
  const triggeredFlags = redFlags.flags.filter((f) => f.triggered);
  const beneishSection = beneish
    ? `M-Score: ${beneish.mScore.toFixed(3)} (${beneish.verdict})
Variables: ${beneish.variables.map((v) => `${v.abbreviation}=${v.value.toFixed(3)}`).join(", ")}`
    : "Insufficient data for Beneish analysis (requires 2+ years)";

  return `You are a forensic financial auditor. Analyze the following financial data and produce a structured forensic audit report.

## Company Information
Company: ${company.companyName}${company.ticker ? ` (${company.ticker})` : ""}
Sector: ${company.sector}
Years analyzed: ${company.years.join(", ")}

## Risk Score Summary
Overall Risk Score: ${riskScore.overall}/100
- Benford's Law component: ${riskScore.benfordScore}/25
- Beneish M-Score component: ${riskScore.beneishScore}/25
- Red Flags component: ${riskScore.redFlagScore}/25
- Financial Ratios component: ${riskScore.ratioScore}/25

## Benford's Law Analysis
Verdict: ${benford.verdict}
Chi-squared: ${benford.chiSquared.toFixed(3)}
p-value: ${benford.pValue.toFixed(5)}
Sample size: ${benford.sampleSize}
Observed vs. Expected: ${benford.observed.map((o, i) => `Digit ${i + 1}: ${o.toFixed(1)}% (expected ${benford.expected[i].toFixed(1)}%)`).join(", ")}

## Beneish M-Score Analysis
${beneishSection}

## Red Flags
Triggered: ${redFlags.triggeredCount}/${redFlags.flags.length} (${redFlags.criticalCount} critical, ${redFlags.warningCount} warning)
Triggered flags:
${triggeredFlags.map((f) => `- [${f.severity.toUpperCase()}] ${f.name}: ${f.description}${f.metric !== undefined ? ` (value: ${f.metric.toFixed(3)}, threshold: ${f.threshold?.toFixed(3)})` : ""}`).join("\n") || "None"}

## Critical Financial Ratios
${criticalRatios.map((r) => `- ${r.name}: ${r.value.toFixed(3)} (benchmark: ${r.benchmark.toFixed(3)}) — ${r.explanation}`).join("\n") || "No critical ratio violations"}

---

Please produce a structured forensic audit report in English with the following sections:

## Executive Summary
(2-3 sentence overview of overall risk and key concerns)

## Key Findings
(Bulleted list of the most significant findings, ordered by severity)

## Detail Analysis
(Deep-dive into Benford's Law results, Beneish M-Score interpretation, and most critical red flags)

## Risk Assessment
(Overall risk characterization, what it means for investors/auditors, areas requiring further investigation)

## Recommendations
(Bulleted list of specific, actionable recommendations for further due diligence)

Be concise, professional, and evidence-based. Reference specific metrics where relevant.`;
}

export async function POST(req: NextRequest) {
  const { analysisData } = (await req.json()) as {
    analysisData: AnalysisResult;
  };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured" },
      { status: 500 },
    );
  }

  const prompt = buildPrompt(analysisData);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "AuditPilot",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return NextResponse.json(
      { error: `OpenRouter error: ${response.status} — ${text.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const json = await response.json();
  const report: string = json.choices?.[0]?.message?.content ?? "";

  if (!report) {
    return NextResponse.json({ error: "No report generated" }, { status: 502 });
  }

  return NextResponse.json({ report });
}
