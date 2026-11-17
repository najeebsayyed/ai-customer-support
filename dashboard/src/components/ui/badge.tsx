import React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors uppercase tracking-wider"

  const variants: Record<string, string> = {
    default: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    secondary: "bg-slate-100 text-slate-800 border border-slate-200",
    destructive: "bg-rose-100 text-rose-800 border border-rose-200",
    outline: "border border-slate-300 text-slate-700 bg-white",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
  }

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  switch (s) {
    case "processed":
    case "answered":
      return <Badge variant="success">{status}</Badge>
    case "failed":
    case "escalated":
      return <Badge variant="destructive">{status}</Badge>
    case "processing":
    case "open":
      return <Badge variant="warning">{status}</Badge>
    case "skipped":
      return <Badge variant="secondary">{status}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
