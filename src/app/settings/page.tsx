"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BellRing, Check, Clock3, Download, Palette, ShieldCheck, Smartphone, Trash2, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/components/ThemeProvider";
import { usePwa } from "@/components/PwaProvider";
import { ANDROID_DOWNLOAD_URL, ANDROID_VERSION } from "@/lib/releases";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [deviceMessage, setDeviceMessage] = useState("");
    const router = useRouter();
    const { theme, setTheme, themes } = useTheme();
    const { canInstall, isInstalled, installApp, notificationState, enableNotifications } = usePwa();

    useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

    const handleDeleteAccount = async () => {
        if (!window.confirm("Permanently delete your account, goals, completions, and reflections? This cannot be undone.")) return;
        setIsDeleting(true); setError("");
        try {
            const response = await fetch("/api/user/delete", { method: "DELETE" });
            if (!response.ok) throw new Error("Deletion failed");
            await signOut({ redirect: false });
            router.push("/"); router.refresh();
        } catch {
            setError("Your account could not be deleted. Please try again.");
        } finally { setIsDeleting(false); }
    };

    if (status === "loading" || !session) return <div className="space-grid min-h-screen" />;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleInstall = async () => {
        const installed = await installApp();
        setDeviceMessage(installed ? "Northstar was added to this device." : "Use your browser menu and choose “Add to Home screen” if the install prompt is not available.");
    };

    const handleNotifications = async () => {
        const permission = await enableNotifications();
        setDeviceMessage(permission === "granted"
            ? "Notifications are enabled. A test signal was sent."
            : permission === "denied"
                ? "Notifications are blocked. Allow them from your browser's site settings."
                : "This browser does not support web notifications.");
    };

    return (
        <div className="space-grid min-h-screen text-[#edf1ff]">
            <div className="aurora-orb pointer-events-none fixed -left-32 top-20 h-72 w-72 rounded-full bg-[#4d39cb]/15" />
            <Navbar />
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
                <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#77819c] transition hover:text-[#82f4eb]"><ArrowLeft size={14} /> Return to workspace</Link>
                <div className="mb-8"><span className="eyebrow"><span className="status-dot" /> System configuration</span><h1 className="gradient-text mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Workspace settings</h1><p className="mt-2 text-sm text-[#747e99]">Appearance, device access, identity, and privacy controls.</p></div>

                <div className="grid gap-5 md:grid-cols-2">
                    <section className="glass-panel rounded-[26px] p-6 md:col-span-2">
                        <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]"><Palette size={20} /></span><div><h2 className="text-sm font-bold text-[#e2e7f5]">Visual theme</h2><p className="text-[11px] text-[#626c87]">Choose the atmosphere that keeps you focused</p></div></div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {themes.map((option) => (
                                <button key={option.id} type="button" onClick={() => setTheme(option.id)} className={`relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${theme === option.id ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_25px_var(--accent-glow)]" : "border-white/[0.08] bg-white/[0.025] hover:border-white/20"}`}>
                                    <span className="mb-4 flex -space-x-1.5">{option.colors.map((color) => <i key={color} className="h-7 w-7 rounded-full border-2 border-[var(--space)]" style={{ background: color }} />)}</span>
                                    <strong className="block text-xs text-white">{option.name}</strong>
                                    <small className="mt-1 block text-[10px] leading-4 text-white/35">{option.description}</small>
                                    {theme === option.id && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--void)]"><Check size={13} strokeWidth={3} /></span>}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="glass-panel rounded-[26px] p-6 md:col-span-2">
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent-2)]/20 bg-white/[0.04] text-[var(--accent-2)]"><Smartphone size={20} /></span><div><h2 className="text-sm font-bold text-[#e2e7f5]">Android app and notifications</h2><p className="text-[11px] text-[#626c87]">Download the native app or install the browser version</p></div></div>
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/45">APK v{ANDROID_VERSION}</span>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <article className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4"><Smartphone size={17} className="text-[var(--accent)]" /><h3 className="mt-3 text-xs font-bold text-white">Native Android APK</h3><p className="mt-1 text-[10px] leading-5 text-white/40">Install the official release with the same Northstar account and live goal data.</p><a href={ANDROID_DOWNLOAD_URL} className="primary-button mt-4 h-9 px-3 text-xs"><Download size={14} /> Download APK</a></article>
                            <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><Download size={17} className="text-[var(--accent)]" /><h3 className="mt-3 text-xs font-bold text-white">Home-screen access</h3><p className="mt-1 text-[10px] leading-5 text-white/35">Launch Northstar full-screen from Android without opening a browser tab first.</p><button type="button" onClick={handleInstall} disabled={isInstalled} className="soft-button mt-4 h-9 px-3 text-xs"><Download size={14} /> {isInstalled ? "Installed" : canInstall ? "Install app" : "Installation guide"}</button></article>
                            <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><BellRing size={17} className="text-[var(--accent-2)]" /><h3 className="mt-3 text-xs font-bold text-white">Device signals</h3><p className="mt-1 text-[10px] leading-5 text-white/35">Grant notification permission and verify that Northstar can reach this device.</p><button type="button" onClick={handleNotifications} disabled={notificationState === "granted" || notificationState === "unsupported"} className="soft-button mt-4 h-9 px-3 text-xs"><BellRing size={14} /> {notificationState === "granted" ? "Enabled" : notificationState === "denied" ? "Blocked" : "Enable & test"}</button></article>
                        </div>
                        {deviceMessage && <p className="mt-4 rounded-xl border border-[var(--accent)]/15 bg-[var(--accent-soft)] px-3 py-2 text-xs text-white/60">{deviceMessage}</p>}
                        <p className="mt-4 text-[10px] leading-5 text-white/30">Reliable scheduled alerts while Northstar is closed require a push backend such as Firebase Cloud Messaging or Web Push with VAPID keys. The app is now ready for that connection.</p>
                    </section>

                    <section className="glass-panel rounded-[26px] p-6">
                        <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#5eead4]/15 bg-gradient-to-br from-[#15616e]/35 to-[#563e94]/35 text-[#83f6ed]"><UserRound size={20} /></span><div><h2 className="text-sm font-bold text-[#e2e7f5]">Identity profile</h2><p className="text-[11px] text-[#626c87]">How Northstar recognizes you</p></div></div>
                        <dl className="space-y-4"><div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"><dt className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#5d6680]">Username</dt><dd className="mt-1 text-sm font-bold text-[#dce3f5]">{session.user.name}</dd></div><div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"><dt className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#5d6680]"><Clock3 size={11} /> Local time node</dt><dd className="mt-1 text-sm font-bold text-[#dce3f5]">{timezone.replaceAll("_", " ")}</dd><p className="mt-1 text-[10px] text-[#59627d]">Synchronized automatically for reminders and daily progress.</p></div></dl>
                    </section>

                    <section className="glass-panel rounded-[26px] p-6">
                        <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#a78bfa]/15 bg-gradient-to-br from-[#273e77]/35 to-[#604192]/35 text-[#bca7ff]"><ShieldCheck size={20} /></span><div><h2 className="text-sm font-bold text-[#e2e7f5]">Privacy core</h2><p className="text-[11px] text-[#626c87]">Your data remains yours</p></div></div>
                        <p className="text-xs leading-5 text-[#78819c]">Goals and reflections are isolated to your authenticated identity. Account deletion removes your profile and all related data.</p>
                        <div className="my-6 h-px bg-white/[0.07]" />
                        <h3 className="text-xs font-bold text-red-300">Terminate workspace</h3><p className="mt-1 text-[11px] leading-5 text-[#626c87]">This permanently removes your goals, check-ins, and reflections. The action cannot be reversed.</p>
                        {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
                        <button onClick={handleDeleteAccount} disabled={isDeleting} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-400/[0.1] disabled:opacity-50"><Trash2 size={14} /> {isDeleting ? "Terminating…" : "Delete workspace"}</button>
                    </section>
                </div>
            </main>
        </div>
    );
}
