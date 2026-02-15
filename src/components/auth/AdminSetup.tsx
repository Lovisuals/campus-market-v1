"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function AdminSetup() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const secret = searchParams.get("setup_admin");
        if (secret) {
            // Persist the admin secret locally
            localStorage.setItem("nexus_admin_secret", secret);

            // Clean up URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete("setup_admin");
            const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
            router.replace(newUrl);
        }
    }, [searchParams, router]);

    return null;
}
