"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-surface-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-xl border border-white/10 bg-white/5
              px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500
              outline-none
              transition-all duration-200
              hover:border-white/15 hover:bg-white/[0.07]
              focus:border-accent-500/50 focus:bg-white/[0.07]
              focus:ring-2 focus:ring-accent-500/20
              disabled:cursor-not-allowed disabled:opacity-50
              ${icon ? "pl-10" : ""}
              ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400 animate-fade-in">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
export { Input };
export type { InputProps };
