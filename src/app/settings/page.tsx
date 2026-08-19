"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, ShieldCheck, Trash2, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

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

    return (
        <div className="space-grid min-h-screen text-[#edf1ff]">
            <div className="aurora-orb pointer-events-none fixed -left-32 top-20 h-72 w-72 rounded-full bg-[#4d39cb]/15" />
            <Navbar />
            <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
                <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#77819c] transition hover:text-[#82f4eb]"><ArrowLeft size={14} /> Return to workspace</Link>
                <div className="mb-8"><span className="eyebrow"><span className="status-dot" /> System configuration</span><h1 className="gradient-text mt-3 font-display text-3xl font-bold tracking-[-0.04em]">Account settings</h1><p className="mt-2 text-sm text-[#747e99]">Identity, local environment, and privacy controls.</p></div>

                <div className="grid gap-5 md:grid-cols-[1fr_.9fr]">
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
