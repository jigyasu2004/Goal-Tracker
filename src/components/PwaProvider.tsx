"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type NotificationState = NotificationPermission | "unsupported";

interface PwaContextValue {
    canInstall: boolean;
    isInstalled: boolean;
    notificationState: NotificationState;
    installApp: () => Promise<boolean>;
    enableNotifications: () => Promise<NotificationState>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
    const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [notificationState, setNotificationState] = useState<NotificationState>("default");

    useEffect(() => {
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setIsInstalled(standalone);
        setNotificationState("Notification" in window ? Notification.permission : "unsupported");

        if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
            navigator.serviceWorker.register("/sw.js").catch((error) => console.error("Service worker registration failed:", error));
        }

        const handlePrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event as InstallPromptEvent);
        };
        const handleInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };

        window.addEventListener("beforeinstallprompt", handlePrompt);
        window.addEventListener("appinstalled", handleInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", handlePrompt);
            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    const installApp = useCallback(async () => {
        if (!installPrompt) return false;
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") setInstallPrompt(null);
        return choice.outcome === "accepted";
    }, [installPrompt]);

    const enableNotifications = useCallback(async (): Promise<NotificationState> => {
        if (!("Notification" in window)) {
            setNotificationState("unsupported");
            return "unsupported";
        }

        const permission = await Notification.requestPermission();
        setNotificationState(permission);

        if (permission === "granted" && "serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Northstar notifications are ready", {
                body: "You can now receive check-in signals on this device.",
                icon: "/icon.svg",
                badge: "/icon.svg",
                tag: "northstar-ready",
            });
        }
        return permission;
    }, []);

    const value = useMemo(() => ({
        canInstall: Boolean(installPrompt),
        isInstalled,
        notificationState,
        installApp,
        enableNotifications,
    }), [installPrompt, isInstalled, notificationState, installApp, enableNotifications]);

    return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
    const context = useContext(PwaContext);
    if (!context) throw new Error("usePwa must be used inside PwaProvider");
    return context;
}
