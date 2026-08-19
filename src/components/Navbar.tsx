"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, Settings, Target } from "lucide-react";

export default function Navbar() {
    const { data: session } = useSession();
    const initial = session?.user?.name?.charAt(0).toUpperCase() || "G";

    return (
        <nav className="sticky top-0 z-40 border-b border-[#e3e9df]/90 bg-[#f5f7f2]/90 backdrop-blur-xl">
            <div className="mx-auto flex h-[68px] w-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="Northstar dashboard">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#204d33] text-[#d9f0b7] shadow-sm"><Target size={19} strokeWidth={2.4} /></span>
                        <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-[#163c28]">Northstar</span>
                    </Link>
                    <div className="hidden items-center gap-1 md:flex">
                        <Link href="/dashboard" className="rounded-full bg-[#e7eee3] px-4 py-2 text-xs font-bold text-[#31573c]">Overview</Link>
                        <a href="#calendar" className="rounded-full px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-[#31573c]">Calendar</a>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/settings" aria-label="Settings" className="nav-icon"><Settings size={17} /></Link>
                    <div className="mx-1 hidden h-7 w-px bg-[#dce4d8] sm:block" />
                    <div className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2.5 shadow-sm ring-1 ring-[#e0e7dc]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfead8] text-xs font-extrabold text-[#315d3e]">{initial}</span>
                        <span className="hidden max-w-28 truncate text-xs font-bold text-slate-600 sm:block">{session?.user?.name}</span>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sign out" className="nav-icon text-slate-400 hover:text-red-600"><LogOut size={17} /></button>
                </div>
            </div>
        </nav>
    );
}
