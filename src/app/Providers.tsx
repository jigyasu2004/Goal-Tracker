"use client";

import { SessionProvider } from "next-auth/react";
import { PwaProvider } from "@/components/PwaProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <PwaProvider>{children}</PwaProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
