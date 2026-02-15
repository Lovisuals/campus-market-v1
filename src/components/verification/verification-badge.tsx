"use client";

import { CheckCircle2, HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    vouchCount?: number;
    showTooltip?: boolean;
}

export function VerificationBadge({ status, vouchCount = 0, showTooltip = true }: VerificationBadgeProps) {
    // Logic: 3+ vouches = Trusted (Gold), Verified = Blue
    const isTrusted = vouchCount >= 3;

    if (status !== 'verified' && !isTrusted) return null;

    const BadgeIcon = isTrusted ? (
        <div className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-yellow-500 fill-yellow-100" />
            <span className="sr-only">Trusted Student</span>
        </div>
    ) : (
        <div className="inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-100" />
            <span className="sr-only">Verified Student</span>
        </div>
    );

    if (!showTooltip) return BadgeIcon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help">{BadgeIcon}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs font-medium">
                        {isTrusted ? "Trusted Student (3+ Vouches)" : "Campus Verified Student"}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
