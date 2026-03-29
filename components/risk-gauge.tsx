"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  size?: number;
}

function getRiskLabel(score: number) {
  if (score < 30) return "Low Risk";
  if (score < 60) return "Medium Risk";
  if (score < 80) return "High Risk";
  return "Critical Risk";
}

function getRiskColor(score: number) {
  if (score < 30) return "#22c55e";
  if (score < 60) return "#eab308";
  if (score < 80) return "#f97316";
  return "#ef4444";
}

// Describe a semicircular arc path (left to right, top half)
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function RiskGauge({ score, size = 200 }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 900;
    const target = Math.max(0, Math.min(100, score));

    function step(timestamp: number) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2 + size * 0.05;
  const r = size * 0.38;
  const strokeWidth = size * 0.07;

  // Arc spans from 180° (left) to 0° (right) going clockwise through bottom = use 180 to 360
  // We render a 180° arc from left to right at the top
  // Angles in SVG: 0° = right, 90° = bottom, 180° = left
  // Semicircle: start at 180° (left), end at 0° (right), large arc
  const trackPath = describeArc(cx, cy, r, 180, 360);

  // Progress arc: 180° + (animatedScore/100)*180°
  const progressEndAngle = 180 + (animatedScore / 100) * 180;
  const progressPath = describeArc(cx, cy, r, 180, progressEndAngle);

  // Needle: angle from 180° to 360° mapped to score 0→100
  const needleAngleDeg = 180 + (animatedScore / 100) * 180;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLen = r - strokeWidth / 2 - 4;
  const nx = cx + needleLen * Math.cos(needleAngleRad);
  const ny = cy + needleLen * Math.sin(needleAngleRad);

  const color = getRiskColor(animatedScore);
  const label = getRiskLabel(score);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size * 0.65}
        viewBox={`0 0 ${size} ${size * 0.65}`}
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="80%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Gradient progress arc */}
        <path
          d={trackPath}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(animatedScore / 100) * Math.PI * r} ${Math.PI * r}`}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={size * 0.04} fill={color} />

        {/* Score text */}
        <text
          x={cx}
          y={cy - size * 0.06}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="700"
          fill={color}
          fontFamily="monospace"
        >
          {animatedScore}
        </text>
      </svg>

      <p className={cn("text-sm font-semibold mt-1")} style={{ color }}>
        {label}
      </p>
    </div>
  );
}
