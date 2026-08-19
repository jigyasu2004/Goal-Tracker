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

    if (status === "loading" || !session) return <div className="min-h-screen bg-[#f5f7f2]" />;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className="min-h-screen bg-[#f5f7f2]">
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
                <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#4e7154] hover:text-[#285d3c]"><ArrowLeft size={14} /> Back to dashboard</Link>
                <div className="mb-8"><span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#71816d]">Your space</span><h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-[#173e2a]">Account settings</h1><p className="mt-2 text-sm text-slate-500">A clear view of your account and privacy.</p></div>

                <div className="grid gap-5 md:grid-cols-[1fr_.9fr]">
                    <section className="rounded-[26px] border border-[#dfe6db] bg-white p-6 shadow-[0_15px_45px_rgba(38,67,48,.05)]">
                        <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f0e3] text-[#426d4d]"><UserRound size={20} /></span><div><h2 className="text-sm font-bold text-slate-700">Profile</h2><p className="text-[11px] text-slate-400">How Northstar knows you</p></div></div>
                        <dl className="space-y-4"><div className="rounded-2xl bg-[#f7f9f5] p-4"><dt className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Username</dt><dd className="mt-1 text-sm font-bold text-[#31523b]">{session.user.name}</dd></div><div className="rounded-2xl bg-[#f7f9f5] p-4"><dt className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400"><Clock3 size={11} /> Local timezone</dt><dd className="mt-1 text-sm font-bold text-[#31523b]">{timezone.replaceAll("_", " ")}</dd><p className="mt-1 text-[10px] text-slate-400">Captured automatically for reminders and daily progress.</p></div></dl>
                    </section>

                    <section className="rounded-[26px] border border-[#dfe6db] bg-white p-6 shadow-[0_15px_45px_rgba(38,67,48,.05)]">
                        <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9eef6] text-[#4b678f]"><ShieldCheck size={20} /></span><div><h2 className="text-sm font-bold text-slate-700">Privacy</h2><p className="text-[11px] text-slate-400">Your data belongs to you</p></div></div>
                        <p className="text-xs leading-5 text-slate-500">Goals and reflections are scoped to your signed-in account. Account deletion removes your profile and its related data.</p>
                        <div className="my-6 h-px bg-[#edf0ea]" />
                        <h3 className="text-xs font-bold text-red-700">Delete account</h3><p className="mt-1 text-[11px] leading-5 text-slate-400">This permanently removes your goals, check-ins, and reflections. It cannot be reversed.</p>
                        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
                        <button onClick={handleDeleteAccount} disabled={isDeleting} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"><Trash2 size={14} /> {isDeleting ? "Deleting…" : "Delete my account"}</button>
                    </section>
                </div>
            </main>
        </div>
    );
}
