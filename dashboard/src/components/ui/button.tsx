import React from "react"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  size?: "sm" | "default" | "lg" | "icon"
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none"

    const variants: Record<string, string> = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
      outline: "border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-sm",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
      ghost: "hover:bg-slate-100 text-slate-700",
      link: "text-indigo-600 underline-offset-4 hover:underline",
    }

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-xs gap-1.5",
      default: "h-9 px-4 py-2 gap-2",
      lg: "h-10 px-6 text-base gap-2.5",
      icon: "h-9 w-9",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
