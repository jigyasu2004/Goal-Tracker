"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import AuthShell from "@/components/AuthShell";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault(); setLoading(true); setError("");
        const result = await signIn("credentials", { username: username.trim(), password, redirect: false });
        setLoading(false);
        if (result?.error) setError("That username and password do not match.");
        else { router.push("/dashboard"); router.refresh(); }
    };

    return (
        <AuthShell eyebrow="Welcome back" title="Return to what matters." description="Your plan is waiting. Sign in and take the next small step." footer={<>New to Northstar? <Link href="/register" className="font-bold text-[#2f6542] hover:underline">Create an account</Link></>}>
            {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block"><span className="form-label">Username</span><div className="relative"><UserRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" /><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="form-input py-3 pl-10" placeholder="Your username" required /></div></label>
                <label className="block"><span className="form-label">Password</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" /><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-input py-3 pl-10" placeholder="Your password" required /></div></label>
                <button type="submit" disabled={loading} className="primary-button mt-2 w-full py-3.5">{loading ? "Signing you in…" : <>Continue to your day <ArrowRight size={16} /></>}</button>
            </form>
        </AuthShell>
    );
}
