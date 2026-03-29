import type {
  BenfordResult,
  BeneishResult,
  RedFlagResult,
  RatioResult,
  RiskScore,
} from "./types";

export function calculateRiskScore(
  benford: BenfordResult,
  beneish: BeneishResult | null,
  redFlags: RedFlagResult,
  ratios: RatioResult[],
): RiskScore {
  // ─── Benford Score (0–25) ────────────────────────────────────────────────────
  // Based on chi-squared value; higher chi-squared = more suspicious
  let benfordScore: number;
  if (benford.sampleSize < 10) {
    benfordScore = 0; // not enough data to assess
  } else if (benford.chiSquared <= 5) {
    benfordScore = 0;
  } else if (benford.chiSquared <= 10) {
    benfordScore = 8;
  } else if (benford.chiSquared <= 15.51) {
    benfordScore = 15;
  } else if (benford.chiSquared <= 25) {
    benfordScore = 20;
  } else {
    benfordScore = 25;
  }

  // ─── Beneish Score (0–25) ────────────────────────────────────────────────────
  // Based on M-Score thresholds
  let beneishScore: number;
  if (beneish === null) {
    beneishScore = 0; // no data
  } else if (beneish.mScore < -2.22) {
    beneishScore = 0;
  } else if (beneish.mScore < -1.78) {
    beneishScore = 10;
  } else if (beneish.mScore < -1.0) {
    beneishScore = 18;
  } else {
    beneishScore = 25;
  }

  // ─── Red Flag Score (0–25) ───────────────────────────────────────────────────
  // critical = 5 points, warning = 3 points, info = 1 point
  const rawRedFlagScore = redFlags.flags.reduce((sum, flag) => {
    if (!flag.triggered) return sum;
    if (flag.severity === "critical") return sum + 5;
    if (flag.severity === "warning") return sum + 3;
    return sum + 1; // info
  }, 0);
  const redFlagScore = Math.min(rawRedFlagScore, 25);

  // ─── Ratio Score (0–25) ──────────────────────────────────────────────────────
  // Based on count of red/yellow ratios
  const redRatios = ratios.filter((r) => r.status === "red").length;
  const yellowRatios = ratios.filter((r) => r.status === "yellow").length;
  const totalRatios = ratios.length;

  let ratioScore: number;
  if (totalRatios === 0) {
    ratioScore = 0;
  } else {
    // Each red ratio contributes proportionally more than yellow
    const rawRatioScore =
      (redRatios * 2 + yellowRatios * 1) / (totalRatios * 2);
    ratioScore = Math.round(rawRatioScore * 25);
  }

  // ─── Overall Score ───────────────────────────────────────────────────────────
  const overall = Math.min(
    benfordScore + beneishScore + redFlagScore + ratioScore,
    100,
  );

  return {
    overall,
    benfordScore,
    beneishScore,
    redFlagScore,
    ratioScore,
  };
}
