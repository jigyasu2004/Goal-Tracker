"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Download, LogOut, Orbit, Settings } from "lucide-react";
import HelpCenter from "./HelpCenter";
import ThemeMenu from "./ThemeMenu";
import { usePwa } from "./PwaProvider";

export default function Navbar() {
    const { data: session } = useSession();
    const { canInstall, isInstalled, installApp } = usePwa();
    const initial = session?.user?.name?.charAt(0).toUpperCase() || "G";

    return (
        <nav className="northstar-nav sticky top-0 z-40 border-b border-white/[0.07] backdrop-blur-2xl">
            <div className="mx-auto flex h-[70px] w-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="group flex items-center gap-2.5" aria-label="Northstar dashboard">
                        <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#78e6df]/20 bg-gradient-to-br from-[#143d58] via-[#283d7a] to-[#4d2d84] text-[#9afff6] shadow-[0_0_25px_rgba(72,127,218,.25)]">
                            <span className="absolute inset-[3px] rounded-lg border border-white/[0.08]" />
                            <Orbit size={19} strokeWidth={2} className="transition duration-700 group-hover:rotate-180" />
                        </span>
                        <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-white">Northstar</span>
                        <span className="hidden rounded-md border border-[#5eead4]/15 bg-[#5eead4]/[0.06] px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-[#77e8df] sm:block">OS</span>
                    </Link>
                    <div className="hidden items-center gap-1 md:flex">
                        <Link href="/dashboard" className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2 text-xs font-bold text-[#dce4fa]">Overview</Link>
                        <a href="#calendar" className="rounded-xl px-4 py-2 text-xs font-semibold text-[#737d99] transition hover:bg-white/[0.04] hover:text-white">Timeline</a>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="mr-1 hidden items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#59637e] lg:flex"><span className="status-dot" /> System online</div>
                    {canInstall && !isInstalled && <button type="button" onClick={installApp} aria-label="Install Northstar app" className="nav-icon"><Download size={17} /></button>}
                    <ThemeMenu />
                    <HelpCenter />
                    <Link href="/settings" aria-label="Settings" className="nav-icon"><Settings size={17} /></Link>
                    <div className="mx-1 hidden h-7 w-px bg-white/[0.08] sm:block" />
                    <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] py-1 pl-1 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:flex">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a6872] to-[#6046a0] text-xs font-extrabold text-white shadow-[0_0_18px_rgba(72,158,190,.2)]">{initial}</span>
                        <span className="hidden max-w-28 truncate text-xs font-bold text-[#aab3cb] sm:block">{session?.user?.name}</span>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" className="nav-icon hover:border-red-400/20 hover:bg-red-400/[0.06] hover:text-red-300"><LogOut size={17} /></button>
                </div>
            </div>
        </nav>
    );
}
