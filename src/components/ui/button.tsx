"use client";

import React, { ReactNode } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", loading = false, disabled = false, ...props }, ref) => {
    // Premium base styles with smooth transitions and depth
    const baseStyles = "font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wa-teal disabled:opacity-60 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-gradient-to-r from-wa-teal to-wa-dark bg-wa-teal text-white hover:shadow-lg hover:shadow-wa-teal/30 active:scale-95",
      secondary: "bg-gray-100 dark:bg-[#2a3942] text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#3d4d57] shadow-sm",
      danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-600/30 active:scale-95",
      ghost: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a3942]",
      outline: "border-2 border-current bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors",
    };

    const sizeStyles = {
      sm: "px-3 py-2 text-sm font-medium",
      md: "px-4 py-3 text-base font-semibold",
      lg: "px-6 py-4 text-lg font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </span>
        ) : (
          props.children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
