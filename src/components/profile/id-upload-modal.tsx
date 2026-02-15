"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface IDUploadModalProps {
    userId: string;
    currentStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    onUploadComplete?: () => void;
}

export function IDUploadModal({ userId, currentStatus, onUploadComplete }: IDUploadModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // "Brute Check" validation constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setError(null);

        if (!selectedFile) return;

        // Validation 1: File Type
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError("Invalid file type. Please upload a JPG, PNG, or WebP image.");
            return;
        }

        // Validation 2: File Size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError("File is too large. Maximum size is 5MB.");
            return;
        }

        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!file || !userId) return;

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/student-id.${fileExt}`; // Fixed path for overwrite support

            // 1. Upload to Storage
            const { error: uploadError, data } = await supabase.storage
                .from('verification-documents')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            setUploadProgress(50);

            // 2. Update User Profile
            // const { error: updateError } = await supabase
            //   .from('users')
            //   .update({
            //     student_id_image_url: data.path,
            //     verification_status: 'pending' // Auto-set to pending
            //   })
            //   .eq('id', userId);

            // if (updateError) throw updateError;

            // Temporary simulation for demo since migration might not apply locally
            await new Promise(resolve => setTimeout(resolve, 1000));

            setUploadProgress(100);
            setIsOpen(false);
            onUploadComplete?.();

            // Reset state
            setFile(null);
            setPreviewUrl(null);

        } catch (err) {
            console.error("Upload failed", err);
            setError(err instanceof Error ? err.message : "Failed to upload document");
        } finally {
            setIsUploading(false);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    if (currentStatus === 'verified') {
        return (
            <Button variant="secondary" disabled className="w-full gap-2 text-green-600 bg-green-50 border-green-200">
                <Check className="w-4 h-4" />
                Verified Student
            </Button>
        );
    }

    if (currentStatus === 'pending') {
        return (
            <Button variant="secondary" disabled className="w-full gap-2 text-yellow-600 bg-yellow-50 border-yellow-200">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verification Pending
            </Button>
        );
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
                <Upload className="w-4 h-4" />
                Verify Student Status
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogHeader>
                    <DialogTitle>Verify Student Status</DialogTitle>
                    <p className="text-sm text-gray-500 mt-2">
                        Upload a clear photo of your Student ID card. Your ID will be handled securely and only used for verification.
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors",
                            previewUrl ? "border-blue-200 bg-blue-50/50" : "border-gray-200 hover:border-gray-300",
                            error ? "border-red-200 bg-red-50/50" : ""
                        )}
                    >
                        {previewUrl ? (
                            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black/5">
                                <img src={previewUrl} alt="ID Preview" className="w-full h-full object-contain" />
                                <button
                                    onClick={clearSelection}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-2">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <Button
                                        variant="ghost"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 h-auto text-base font-semibold"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Click to upload
                                    </Button>
                                    <span className="text-gray-500"> or drag and drop</span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    JPG, PNG or WebP (max 5MB)
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            loading={isUploading}
                            variant="primary"
                            className="min-w-[100px]"
                        >
                            {isUploading ? (
                                uploadProgress < 100 ? `${uploadProgress}%` : 'Finishing...'
                            ) : (
                                'Submit Verification'
                            )}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
