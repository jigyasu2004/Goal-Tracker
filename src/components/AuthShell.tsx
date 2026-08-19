import Link from "next/link";
import { Activity, CheckCircle2, Orbit, Sparkles } from "lucide-react";

interface AuthShellProps {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}

export default function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
    return (
        <main className="space-grid relative min-h-screen overflow-hidden p-3 text-[#edf1ff] sm:p-5">
            <div className="aurora-orb pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-[#4c36cc]/20" /><div className="aurora-orb aurora-orb-delayed pointer-events-none absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-[#08b8c1]/15" />
            <div className="glass-panel relative z-10 mx-auto grid min-h-[calc(100vh-24px)] max-w-6xl overflow-hidden rounded-[30px] sm:min-h-[calc(100vh-40px)] lg:grid-cols-[1.05fr_.95fr]">
                <section className="relative hidden overflow-hidden border-r border-white/[0.07] bg-gradient-to-br from-[#111b3b]/70 via-[#17152e]/70 to-[#0b0d1a]/80 p-12 lg:flex lg:flex-col">
                    <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border border-[#8d7ef2]/10" /><div className="absolute -right-12 -top-8 h-56 w-56 rounded-full border border-[#5eead4]/10" /><div className="absolute right-20 top-16 h-3 w-3 rounded-full bg-[#5eead4] shadow-[0_0_25px_#5eead4]" />
                    <Link href="/" className="group relative z-10 flex items-center gap-2.5"><span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-gradient-to-br from-[#174c62] to-[#4f348a] text-[#8ffff6] shadow-[0_0_25px_rgba(94,234,212,.14)]"><Orbit size={20} className="transition duration-700 group-hover:rotate-180" /></span><span className="font-display text-lg font-extrabold">Northstar</span><span className="rounded-md border border-[#5eead4]/15 bg-[#5eead4]/[0.06] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#77e8df]">OS</span></Link>
                    <div className="relative z-10 my-auto max-w-md"><span className="eyebrow"><Sparkles size={13} /> Personal evolution system</span><blockquote className="gradient-text mt-5 font-display text-4xl font-bold leading-[1.12] tracking-[-0.045em]">Your future is built from signals you repeat today.</blockquote><p className="mt-5 max-w-sm text-sm leading-6 text-[#7c86a2]">Northstar turns meaningful goals into visible daily actions, then helps you adapt with clarity—not guilt.</p></div>
                    <div className="relative z-10 grid grid-cols-3 gap-3">{["Set coordinates", "Execute", "Evolve"].map((item, index) => <div key={item} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-[10px] font-semibold text-[#aab3ca]"><CheckCircle2 className="mb-2 text-[#6de9e0]" size={14} /><span className="block text-[7px] font-black tracking-widest text-[#4f5972]">0{index + 1}</span>{item}</div>)}</div>
                </section>
                <section className="relative flex items-center justify-center p-6 sm:p-10 lg:p-14">
                    <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[#6550db]/10 blur-3xl" />
                    <div className="relative w-full max-w-md">
                        <Link href="/" className="group mb-10 flex items-center gap-2.5 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#5eead4]/20 bg-gradient-to-br from-[#174c62] to-[#4f348a] text-[#8ffff6]"><Orbit size={18} className="transition group-hover:rotate-90" /></span><span className="font-display font-extrabold text-white">Northstar</span></Link>
                        <span className="eyebrow"><Activity size={12} /> {eyebrow}</span>
                        <h1 className="gradient-text mt-3 font-display text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{title}</h1>
                        <p className="mb-8 mt-3 text-sm leading-6 text-[#7d87a2]">{description}</p>
                        {children}
                        <div className="mt-7 text-center text-sm text-[#69728d]">{footer}</div>
                    </div>
                </section>
            </div>
        </main>
    );
}
