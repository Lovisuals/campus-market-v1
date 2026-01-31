"use client";

import React, { ReactNode, useState } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50">
        <div className="bg-white dark:bg-[#111b21] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};

interface DialogContentProps {
  children: ReactNode;
}

export const DialogContent = ({ children }: DialogContentProps) => <>{children}</>;

interface DialogHeaderProps {
  children: ReactNode;
}

export const DialogHeader = ({ children }: DialogHeaderProps) => (
  <div className="mb-4">{children}</div>
);

interface DialogTitleProps {
  children: ReactNode;
}

export const DialogTitle = ({ children }: DialogTitleProps) => (
  <h2 className="text-xl font-black text-gray-900 dark:text-white">{children}</h2>
);
