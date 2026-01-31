"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-[#202c33] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:border-wa-teal focus:ring-2 focus:ring-wa-teal/20 hover:border-gray-400 dark:hover:border-gray-600 ${
            error 
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
              : "border-gray-300 dark:border-[#2a3942]"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
