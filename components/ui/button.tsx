import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({ className = "", variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-brand-600 text-white shadow-sm shadow-violet-200 hover:bg-brand-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  };
  const sizes = { sm: "h-9 px-3 text-xs", md: "h-10 px-4 text-sm" };
  return <button type={type} className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
