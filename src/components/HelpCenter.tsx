"use client";

import { useEffect, useRef, useState } from "react";
import {
    BarChart3,
    BellRing,
    BrainCircuit,
    CalendarDays,
    CircleHelp,
    Download,
    NotebookPen,
    Palette,
    Repeat2,
    Target,
    X,
} from "lucide-react";

const CAPABILITIES = [
    { icon: Target, title: "Goals and tasks", text: "Create one-time actions, multi-day goals, and clear target dates." },
    { icon: Repeat2, title: "Habit rhythms", text: "Repeat habits on the weekdays that fit your real routine." },
    { icon: CalendarDays, title: "Progress timeline", text: "Open any date to plan, check in, or review what happened." },
    { icon: BarChart3, title: "Momentum signals", text: "See daily completion, streaks, and seven-day consistency." },
    { icon: NotebookPen, title: "Reflections", text: "Save general notes or connect an insight to a day or goal." },
    { icon: BrainCircuit, title: "Momentum Coach", text: "Get a practical next step from your current goals and progress." },
    { icon: Palette, title: "Personal themes", text: "Switch the visual system while keeping the same workspace." },
    { icon: Download, title: "Install on Android", text: "Add Northstar to your home screen for app-like, full-screen access." },
];

export default function HelpCenter({ showLabel = false }: { showLabel?: boolean }) {
    const [open, setOpen] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
        window.addEventListener("keydown", closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open help center"
                className={showLabel ? "soft-button" : "nav-icon"}
            >
                <CircleHelp size={17} />
                {showLabel && <span>Help</span>}
            </button>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#02030a]/80 p-0 backdrop-blur-md sm:items-center sm:p-5" onMouseDown={() => setOpen(false)}>
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="help-title"
                        className="help-dialog glass-panel max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-[28px] p-5 sm:rounded-[30px] sm:p-7"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <header className="flex items-start justify-between gap-5 border-b border-white/[0.08] pb-5">
                            <div>
                                <span className="eyebrow"><span className="status-dot" /> Operator guide</span>
                                <h2 id="help-title" className="gradient-text mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">What can Northstar do?</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Turn an ambition into repeatable daily action, then use your progress and reflections to adjust the system.</p>
                            </div>
                            <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="nav-icon flex-none" aria-label="Close help center"><X size={18} /></button>
                        </header>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {CAPABILITIES.map(({ icon: Icon, title, text }) => (
                                <article key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                                    <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Icon size={17} /></span>
                                    <h3 className="text-xs font-bold text-white">{title}</h3>
                                    <p className="mt-1.5 text-[11px] leading-5 text-white/40">{text}</p>
                                </article>
                            ))}
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                            <article className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-5">
                                <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--accent)]">Recommended loop</span>
                                <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {["Choose one useful action", "Check in honestly", "Reflect and adjust"].map((step, index) => (
                                        <li key={step} className="flex gap-2.5 text-xs leading-5 text-white/65"><strong className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-white/10 text-[10px] text-white">{index + 1}</strong>{step}</li>
                                    ))}
                                </ol>
                            </article>
                            <article className="rounded-2xl border border-white/[0.08] bg-[#070916]/60 p-5">
                                <div className="flex items-center gap-2 text-[var(--accent-2)]"><BellRing size={16} /><h3 className="text-xs font-bold text-white">Notifications</h3></div>
                                <p className="mt-2 text-[11px] leading-5 text-white/40">Device permission and a test signal are available in Settings. Reliable reminders while the app is closed require a push provider.</p>
                            </article>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
