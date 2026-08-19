"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeMenu({ showLabel = false }: { showLabel?: boolean }) {
    const { theme, setTheme, themes } = useTheme();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const closeMenu = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", closeMenu);
        return () => document.removeEventListener("mousedown", closeMenu);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-label="Choose appearance theme"
                aria-haspopup="menu"
                aria-expanded={open}
                className={showLabel ? "soft-button" : "nav-icon"}
            >
                <Palette size={17} />
                {showLabel && <span>Theme</span>}
            </button>

            {open && (
                <div role="menu" className="theme-menu absolute right-0 top-12 z-[70] w-[min(320px,calc(100vw-2rem))] rounded-2xl p-2">
                    <div className="px-2 pb-2 pt-1">
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--muted)]">Visual frequency</p>
                        <p className="mt-1 text-xs text-white/55">Your choice is saved on this device.</p>
                    </div>
                    <div className="grid gap-1">
                        {themes.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={theme === option.id}
                                onClick={() => { setTheme(option.id); setOpen(false); }}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${theme === option.id ? "border-[var(--accent)]/30 bg-white/[0.07]" : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"}`}
                            >
                                <span className="flex -space-x-1">
                                    {option.colors.map((color) => <i key={color} className="h-5 w-5 rounded-full border-2 border-[var(--space)]" style={{ background: color }} />)}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <strong className="block text-xs text-white">{option.name}</strong>
                                    <small className="block truncate text-[9px] text-white/40">{option.description}</small>
                                </span>
                                {theme === option.id && <Check size={15} className="text-[var(--accent)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
