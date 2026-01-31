"use client";

import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "pending";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export const Badge = ({ variant = "info", size = "sm", children }: BadgeProps) => {
  const variantStyles = {
    success: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50",
    warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50",
    danger: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50",
    info: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50",
    pending: "bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800/50",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs font-semibold",
    md: "px-3 py-1.5 text-sm font-semibold",
  };

  return (
    <span className={`inline-flex items-center rounded-full transition-colors ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
};
