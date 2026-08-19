"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, ChevronDown, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Goal, isGoalCompleteForDate } from "@/lib/goal-utils";

interface MomentumCoachProps {
    goals: Goal[];
    selectedDate: Date;
    progress: { completed: number; total: number; percentage: number };
    streak: number;
    consistency: number;
}

const QUICK_PROMPTS = ["What should I focus on today?", "Help me rebuild consistency", "Break my next goal into one step"];

function dateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function MomentumCoach({ goals, selectedDate, progress, streak, consistency }: MomentumCoachProps) {
    const [expanded, setExpanded] = useState(false);
    const [question, setQuestion] = useState(QUICK_PROMPTS[0]);
    const [answer, setAnswer] = useState("");
    const [mode, setMode] = useState<"ai" | "local" | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const localSignal = useMemo(() => {
        const nextGoal = goals.find((goal) => !isGoalCompleteForDate(goal, selectedDate));
        if (progress.total === 0) return "Create one action small enough to finish today. Clarity starts when a goal has a visible next move.";
        if (progress.percentage === 100) return `Protect the win: write one sentence about what made today work${streak > 1 ? ` and keep your ${streak}-day rhythm intact` : ""}.`;
        if (nextGoal) return `Next signal: ${nextGoal.title}. Make the first two minutes so easy that starting feels automatic.`;
        return "Choose the action with the smallest useful next step and begin there.";
    }, [goals, progress, selectedDate, streak]);

    const askCoach = async (prompt = question) => {
        const cleanPrompt = prompt.trim();
        if (!cleanPrompt || loading) return;
        setQuestion(cleanPrompt);
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/coach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: cleanPrompt, date: dateKey(selectedDate) }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Coach unavailable");
            setAnswer(data.advice);
            setMode(data.mode);
        } catch (requestError) {
            console.error(requestError);
            setError("The coach could not connect. Your local focus signal is still available above.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="coach-panel mb-6 overflow-hidden rounded-[24px] border border-[var(--accent)]/15">
            <button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5" aria-expanded={expanded}>
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)] shadow-[0_0_24px_var(--accent-glow)]"><BrainCircuit size={20} /></span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[var(--accent)]"><Sparkles size={11} /> Momentum coach</span>
                    <strong className="mt-1 block truncate text-sm text-white sm:text-base">{localSignal}</strong>
                    <small className="mt-1 block text-[10px] text-white/35">{consistency}% weekly consistency · Ask for a goal-aware action plan</small>
                </span>
                <ChevronDown size={18} className={`flex-none text-white/35 transition ${expanded ? "rotate-180" : ""}`} />
            </button>

            {expanded && (
                <div className="border-t border-white/[0.07] px-4 pb-5 pt-4 sm:px-5">
                    <div className="flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => askCoach(prompt)} disabled={loading} className="rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/55 transition hover:border-[var(--accent)]/30 hover:text-white disabled:opacity-40">{prompt}</button>)}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <input value={question} maxLength={280} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askCoach(); }} placeholder="Ask about focus, consistency, or your next step…" className="form-input min-w-0 flex-1" />
                        <button type="button" onClick={() => askCoach()} disabled={loading || !question.trim()} className="primary-button flex-none px-4 py-2" aria-label="Ask momentum coach"><Send size={15} /> <span className="hidden sm:inline">{loading ? "Thinking…" : "Ask"}</span></button>
                    </div>
                    {answer && <article className="mt-4 rounded-2xl border border-white/[0.08] bg-[#070916]/55 p-4"><div className="mb-2 flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[var(--accent)]"><BrainCircuit size={12} /> {mode === "ai" ? "AI coaching plan" : "Local coaching plan"}</div><p className="whitespace-pre-wrap text-sm leading-6 text-white/65">{answer}</p></article>}
                    {error && <p className="mt-3 text-xs text-amber-200">{error}</p>}
                    <p className="mt-3 flex items-start gap-2 text-[9px] leading-4 text-white/30"><ShieldCheck size={12} className="mt-0.5 flex-none" /> Reflections stay private. Goal titles and progress are sent to OpenAI only when the server owner configures an API key.</p>
                </div>
            )}
        </section>
    );
}
