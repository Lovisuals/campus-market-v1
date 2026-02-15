"use client";

import { useState } from "react";
import { ThumbsUp, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vouchForUser } from "@/lib/actions/vouch";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface VouchButtonProps {
    targetUserId: string;
    initialVouchCount: number;
    hasVouched?: boolean; // If current user has already vouched
    isOwnProfile?: boolean;
}

export function VouchButton({
    targetUserId,
    initialVouchCount,
    hasVouched = false,
    isOwnProfile = false
}: VouchButtonProps) {
    const [vouchCount, setVouchCount] = useState(initialVouchCount);
    const [hasVouchedState, setHasVouchedState] = useState(hasVouched);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    if (isOwnProfile) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                    {vouchCount} {vouchCount === 1 ? 'Trust Vouch' : 'Trust Vouches'}
                </span>
            </div>
        )
    }

    const handleVouch = async () => {
        if (hasVouchedState) return;

        setIsLoading(true);
        try {
            const result = await vouchForUser(targetUserId);

            if (result.success) {
                setVouchCount(prev => prev + 1);
                setHasVouchedState(true);
                toast({
                    title: "Vouch Successful!",
                    description: "You have vouched for this student's trustworthiness.",
                    className: "bg-green-50 border-green-200 text-green-800",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Cannot Vouch",
                    description: result.error || "Something went wrong.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to connect to server.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={handleVouch}
                disabled={hasVouchedState || isLoading}
                variant={hasVouchedState ? "secondary" : "primary"}
                className={cn(
                    "transition-all duration-300 gap-2 rounded-full",
                    hasVouchedState
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg" // Custom override for primary
                )}
            >
                {isLoading ? (
                    <span className="animate-spin">⌛</span>
                ) : hasVouchedState ? (
                    <Check className="w-4 h-4" />
                ) : (
                    <ThumbsUp className="w-4 h-4" />
                )}

                {hasVouchedState ? "Vouched" : "Vouch for Trust"}
            </Button>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-full border border-gray-100 shadow-sm ml-1">
                <Shield className={cn("w-3.5 h-3.5", vouchCount >= 3 ? "text-yellow-500 fill-yellow-100" : "text-gray-400")} />
                <span className="text-sm font-bold text-gray-700">{vouchCount}</span>
            </div>
        </div>
    );
}
