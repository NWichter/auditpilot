"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { RedFlag } from "@/lib/types";

interface RedflagsListProps {
  flags: RedFlag[];
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };

const SEVERITY_STYLES = {
  critical: {
    border: "border-red-500/20",
    bg: "bg-red-500/[0.04]",
    text: "text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: "text-red-400/70",
  },
  warning: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.04]",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "text-amber-400/70",
  },
  info: {
    border: "border-white/[0.06]",
    bg: "",
    text: "text-slate-400",
    badge: "bg-white/[0.04] text-slate-400 border-white/[0.08]",
    icon: "text-slate-600",
  },
};

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
      {sorted.map((flag) => {
        const isExpanded = expanded.has(flag.id);
        const styles = flag.triggered
          ? SEVERITY_STYLES[flag.severity]
          : SEVERITY_STYLES.info;

        return (
          <div
            key={flag.id}
            className={`card-glass rounded-xl border transition-all duration-200 ${styles.border} ${styles.bg}`}
          >
            <button
              onClick={() => toggle(flag.id)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              {flag.triggered ? (
                <AlertTriangle
                  className={`h-4 w-4 flex-shrink-0 ${styles.icon}`}
                />
              ) : (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-slate-700" />
              )}

              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-medium ${flag.triggered ? styles.text : "text-slate-500"}`}
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

              {isExpanded ? (
                <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-600" />
              ) : (
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-600" />
              )}
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-white/[0.05] px-4 py-4 space-y-3">
                <p className="text-sm leading-relaxed text-slate-400">
                  {flag.description}
                </p>

                {flag.triggered &&
                  (flag.metric !== undefined ||
                    flag.threshold !== undefined) && (
                    <div className="flex gap-6 text-xs">
                      {flag.metric !== undefined && (
                        <div>
                          <span className="text-slate-600">Metric</span>
                          <span className="ml-2 font-mono tabular-nums text-slate-300">
                            {flag.metric.toFixed(3)}
                          </span>
                        </div>
                      )}
                      {flag.threshold !== undefined && (
                        <div>
                          <span className="text-slate-600">Threshold</span>
                          <span className="ml-2 font-mono tabular-nums text-slate-300">
                            {flag.threshold.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {flag.details && (
                  <p className="text-xs leading-relaxed text-slate-600">
                    {flag.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
