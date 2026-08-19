import Link from "next/link";
import { CheckCircle2, Sparkles, Target } from "lucide-react";

interface AuthShellProps {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}

export default function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
    return (
        <main className="min-h-screen bg-[#f4f6ef] p-3 sm:p-5">
            <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-6xl overflow-hidden rounded-[30px] border border-[#dfe6da] bg-white shadow-[0_25px_90px_rgba(31,66,43,.1)] sm:min-h-[calc(100vh-40px)] lg:grid-cols-[1.05fr_.95fr]">
                <section className="relative hidden overflow-hidden bg-[#1d4931] p-12 text-white lg:flex lg:flex-col">
                    <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border border-white/10" /><div className="absolute -right-12 -top-8 h-56 w-56 rounded-full border border-white/10" /><div className="absolute bottom-20 left-[-100px] h-60 w-60 rounded-full bg-[#b8de84]/10 blur-2xl" />
                    <Link href="/" className="relative z-10 flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8efb1] text-[#204c33]"><Target size={20} /></span><span className="font-display text-lg font-extrabold">Northstar</span></Link>
                    <div className="relative z-10 my-auto max-w-md"><Sparkles className="mb-5 text-[#cde89e]" size={24} /><blockquote className="font-display text-4xl font-bold leading-[1.12] tracking-[-0.04em]">You do not need a perfect plan. You need a plan you can return to.</blockquote><p className="mt-5 max-w-sm text-sm leading-6 text-white/60">Northstar turns meaningful goals into visible daily actions, then helps you learn from the days that do not go as planned.</p></div>
                    <div className="relative z-10 grid grid-cols-3 gap-3">{["Plan clearly", "Check in", "Learn weekly"].map((item) => <div key={item} className="rounded-2xl bg-white/[0.07] p-3 text-xs font-semibold text-white/80 ring-1 ring-white/10"><CheckCircle2 className="mb-2 text-[#c9e99a]" size={15} />{item}</div>)}</div>
                </section>
                <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
                    <div className="w-full max-w-md">
                        <Link href="/" className="mb-10 flex items-center gap-2.5 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#214d33] text-[#d8efb1]"><Target size={18} /></span><span className="font-display font-extrabold text-[#173e2a]">Northstar</span></Link>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#71816d]">{eyebrow}</span>
                        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-[#173e2a] sm:text-4xl">{title}</h1>
                        <p className="mb-8 mt-3 text-sm leading-6 text-slate-500">{description}</p>
                        {children}
                        <div className="mt-7 text-center text-sm text-slate-500">{footer}</div>
                    </div>
                </section>
            </div>
        </main>
    );
}
