"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "green" | "yellow" | "red";
  icon: LucideIcon;
  href?: string;
}

const statusBorder: Record<string, string> = {
  green: "border-l-green-500",
  yellow: "border-l-yellow-500",
  red: "border-l-red-500",
};

const statusText: Record<string, string> = {
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;

    function step(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

function CardContent({
  title,
  value,
  subtitle,
  status,
  icon: Icon,
}: KpiCardProps) {
  const isNumber = typeof value === "number";
  const animatedValue = useCountUp(isNumber ? (value as number) : 0);
  const displayValue = isNumber ? animatedValue : value;

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border border-l-4 p-4 flex flex-col gap-2",
        "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40",
        status ? statusBorder[status] : "border-l-border",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "p-2 rounded-md bg-muted",
            status ? statusText[status] : "text-muted-foreground",
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        {status && (
          <span
            className={cn(
              "w-2 h-2 rounded-full mt-1",
              status === "green" && "bg-green-500",
              status === "yellow" && "bg-yellow-500",
              status === "red" && "bg-red-500",
            )}
          />
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {displayValue}
        </p>
        <p className="text-sm font-medium text-foreground/80 mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function KpiCard(props: KpiCardProps) {
  if (props.href) {
    return (
      <Link href={props.href} className="block">
        <CardContent {...props} />
      </Link>
    );
  }
  return <CardContent {...props} />;
}
