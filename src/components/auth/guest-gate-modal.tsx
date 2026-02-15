"use client";

import React from "react";
import { Lock, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface GuestGateModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
}

export function GuestGateModal({ isOpen, onClose, featureName = "this feature" }: GuestGateModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative w-full max-w-sm bg-nexus-dark border border-white/10 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-20 h-20 rounded-full bg-nexus-dark border-2 border-white/10 mx-auto mb-6 flex items-center justify-center relative">
                    <Lock className="w-8 h-8 text-nexus-primary" />
                    <div className="absolute inset-0 bg-nexus-primary/20 blur-xl rounded-full" />
                </div>

                <h2 className="text-2xl font-black text-white mb-2">Student Access Only</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    You need to be a verified student to use <b>{featureName}</b>. Sign up now to unlock the full Campus Market experience.
                </p>

                <div className="space-y-3">
                    <Link href="/register" className="block">
                        <Button className="w-full bg-nexus-primary hover:bg-indigo-500 text-white font-bold h-12 rounded-xl">
                            Create Student ID
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>

                    <Link href="/login" className="block">
                        <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                            I already have an account
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
