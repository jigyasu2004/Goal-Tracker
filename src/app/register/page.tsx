"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, AtSign, LockKeyhole, UserRound } from "lucide-react";
import AuthShell from "@/components/AuthShell";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); setLoading(true); setError("");
        try {
            const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username.trim(), email: email.trim(), password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Registration failed.");
            router.push("/login?created=true");
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Registration failed.");
        } finally { setLoading(false); }
    };

    return (
        <AuthShell eyebrow="System initialization" title="Create your command center." description="A private operating system for goals, habits, and honest reflection." footer={<>Already initialized? <Link href="/login" className="font-bold text-[#70e8df] hover:underline">Sign in</Link></>}>
            {error && <div role="alert" className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3.5">
                <label className="block"><span className="form-label">Identity</span><div className="relative"><UserRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4e5872]" /><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="form-input py-3 pl-10" placeholder="3–30 letters or numbers" minLength={3} maxLength={30} pattern="[a-zA-Z0-9_-]+" required /></div></label>
                <label className="block"><span className="form-label">Comms channel</span><div className="relative"><AtSign size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4e5872]" /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-input py-3 pl-10" placeholder="you@example.com" required /></div></label>
                <label className="block"><span className="form-label">Access key</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4e5872]" /><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-input py-3 pl-10" placeholder="At least 8 characters" minLength={8} maxLength={128} required /></div></label>
                <p className="text-[11px] leading-5 text-[#59627c]">Initialize with curiosity—not guilt. Your trajectory can always adapt.</p>
                <button type="submit" disabled={loading} className="primary-button w-full py-3.5">{loading ? "Initializing system…" : <>Create workspace <ArrowRight size={16} /></>}</button>
            </form>
        </AuthShell>
    );
}
