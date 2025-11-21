"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { trackEngagement } from "@/lib/analysis/google-analytics";

export function SignOutButton() {
    const handleSignOut = () => {
        trackEngagement("sign_out", "button");
        signOut({ callbackUrl: "/" });
    };

    return (
        <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
        </Button>
    );
}
