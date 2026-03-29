"use client";

import { useState } from "react";
import type { RedFlag } from "@/lib/types";

interface RedflagsListProps {
  flags: RedFlag[];
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

const SEVERITY_STYLES = {
  critical: {
    border: "border-red-700",
    bg: "bg-red-950/40",
    text: "text-red-400",
    badge: "bg-red-900/60 text-red-300 border-red-700",
  },
  warning: {
    border: "border-yellow-700",
    bg: "bg-yellow-950/30",
    text: "text-yellow-400",
    badge: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
  },
  info: {
    border: "border-slate-600",
    bg: "bg-slate-800/40",
    text: "text-slate-400",
    badge: "bg-slate-800 text-slate-400 border-slate-600",
  },
};

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 11.08V12a10 10 0 11-5.93-9.14"
      />
      <polyline
        points="22,4 12,14.01 9,11.01"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RedflagsList({ flags }: RedflagsListProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const sorted = [...flags].sort((a, b) => {
    if (a.triggered !== b.triggered) return a.triggered ? -1 : 1;
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {sorted.map((flag, index) => {
        const isExpanded = expanded.has(flag.id);
        const styles = flag.triggered
          ? SEVERITY_STYLES[flag.severity]
          : SEVERITY_STYLES.info;
        const delay = `${index * 50}ms`;

        return (
          <div
            key={flag.id}
            className={`rounded-lg border transition-all duration-300 ${styles.border} ${styles.bg}`}
            style={{
              animationDelay: delay,
              animation: "fadeInDown 0.3s ease forwards",
              opacity: 1,
            }}
          >
            <button
              onClick={() => toggle(flag.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              {flag.triggered ? (
                <AlertTriangleIcon
                  className={`h-5 w-5 flex-shrink-0 ${styles.text}`}
                />
              ) : (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-slate-500" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${flag.triggered ? styles.text : "text-slate-400"}`}
                  >
                    {flag.name}
                  </span>
                  {flag.triggered && (
                    <span
                      className={`rounded border px-1.5 py-0.5 text-xs font-medium ${styles.badge}`}
                    >
                      {flag.severity.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <span className="text-slate-500 text-xs flex-shrink-0">
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-slate-700/50 px-4 py-3 space-y-2">
                <p className="text-sm text-slate-300">{flag.description}</p>

                {flag.triggered &&
                  (flag.metric !== undefined ||
                    flag.threshold !== undefined) && (
                    <div className="flex gap-4 text-xs">
                      {flag.metric !== undefined && (
                        <span className="text-slate-400">
                          Metric:{" "}
                          <span className="font-mono text-slate-200">
                            {flag.metric.toFixed(3)}
                          </span>
                        </span>
                      )}
                      {flag.threshold !== undefined && (
                        <span className="text-slate-400">
                          Threshold:{" "}
                          <span className="font-mono text-slate-200">
                            {flag.threshold.toFixed(3)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                {flag.details && (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {flag.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
