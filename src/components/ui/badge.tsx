"use client";

import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}

export const Badge = ({ variant = "info", children }: BadgeProps) => {
  const variantStyles = {
    success: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${variantStyles[variant]}`}>
      {children}
    </span>
  );
};
