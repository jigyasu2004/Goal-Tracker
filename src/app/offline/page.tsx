import Link from "next/link";
import { Orbit, RefreshCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
    return (
        <main className="space-grid flex min-h-screen items-center justify-center px-5 text-[#edf1ff]">
            <section className="glass-panel w-full max-w-lg rounded-[30px] p-8 text-center sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]"><WifiOff size={27} /></div>
                <span className="eyebrow mt-6"><Orbit size={12} /> Signal interrupted</span>
                <h1 className="gradient-text mt-3 font-display text-3xl font-bold">You are offline.</h1>
                <p className="mt-3 text-sm leading-6 text-white/45">Northstar needs a connection to safely synchronize your goals and reflections. Your workspace will be ready when the signal returns.</p>
                <Link href="/dashboard" className="primary-button mt-7"><RefreshCw size={15} /> Reconnect</Link>
            </section>
        </main>
    );
}
