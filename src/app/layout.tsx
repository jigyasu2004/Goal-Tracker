import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Northstar — Goals that become habits",
    description: "Plan meaningful goals, build consistent habits, and reflect on your progress.",
    manifest: "/manifest.webmanifest",
    applicationName: "Northstar",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Northstar",
    },
    formatDetection: { telephone: false },
};

export const viewport: Viewport = {
    themeColor: "#060712",
    colorScheme: "dark",
};

const themeBootScript = `
try {
  const saved = localStorage.getItem('northstar-theme');
  const allowed = ['nebula', 'solar', 'matrix', 'quantum'];
  document.documentElement.dataset.theme = allowed.includes(saved) ? saved : 'nebula';
} catch (_) {
  document.documentElement.dataset.theme = 'nebula';
}`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme="nebula" suppressHydrationWarning>
            <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
