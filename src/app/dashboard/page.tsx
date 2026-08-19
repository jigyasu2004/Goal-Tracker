"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Flame, RefreshCw, Sparkles, Target } from "lucide-react";
import Navbar from "@/components/Navbar";
import Calendar from "@/components/Calendar";
import RightPanel from "@/components/RightPanel";
import {
    Goal,
    getCurrentStreak,
    getDayProgress,
    getWeekSnapshot,
    goalsForDate,
    isGoalCompleteForDate,
} from "@/lib/goal-utils";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    const fetchGoals = useCallback(async () => {
        setError("");
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/goals", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch goals");
            setGoals(await res.json());
        } catch (fetchError) {
            console.error(fetchError);
            setError("We could not refresh your goals. Check your connection and try again.");
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (session) fetchGoals();
    }, [session, fetchGoals]);

    const toggleGoalStatus = async (goalId: string, nextStatus: string, date?: Date) => {
        const previousGoals = goals;

        setGoals((currentGoals) => currentGoals.map((goal) => {
            if (goal.id !== goalId) return goal;
            if (!date) return { ...goal, status: nextStatus };

            const completions = [...(goal.completions || [])];
            const existingIndex = completions.findIndex(
                (completion) => new Date(completion.date).toDateString() === date.toDateString(),
            );

            if (existingIndex >= 0) {
                completions[existingIndex] = { ...completions[existingIndex], completed: nextStatus === "completed" };
            } else {
                completions.push({ id: `temp-${Date.now()}`, date: date.toISOString(), completed: nextStatus === "completed" });
            }

            return { ...goal, completions };
        }));

        try {
            const dateKey = date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                : undefined;
            const res = await fetch("/api/goals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: goalId, status: nextStatus, date: dateKey }),
            });
            if (!res.ok) throw new Error("Failed to update goal");
        } catch (updateError) {
            console.error(updateError);
            setGoals(previousGoals);
            setError("That check-in did not save. Your previous state was restored.");
        }
    };

    const deleteGoal = async (goalId: string) => {
        const previousGoals = goals;
        setGoals((current) => current.filter((goal) => goal.id !== goalId));

        const res = await fetch("/api/goals", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: goalId }),
        });

        if (!res.ok) {
            setGoals(previousGoals);
            setError("That goal could not be deleted.");
        }
    };

    const selectedDateGoals = useMemo(() => goalsForDate(goals, selectedDate), [goals, selectedDate]);
    const todayProgress = useMemo(() => getDayProgress(goals, new Date()), [goals]);
    const streak = useMemo(() => getCurrentStreak(goals), [goals]);
    const week = useMemo(() => getWeekSnapshot(goals), [goals]);
    const weeklyCompleted = week.reduce((sum, day) => sum + day.completed, 0);
    const weeklyTotal = week.reduce((sum, day) => sum + day.total, 0);
    const consistency = weeklyTotal === 0 ? 0 : Math.round((weeklyCompleted / weeklyTotal) * 100);
    const nextAction = todayProgress.scheduled.find((goal) => !isGoalCompleteForDate(goal, new Date()));

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f7f2]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#dce5d6] border-t-[#255c3b]" />
                    <p className="text-sm font-semibold text-slate-600">Preparing your day…</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    return (
        <div className="min-h-screen bg-[#f5f7f2] text-slate-900">
            <Navbar />
            <main className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#6e806d]">
                            <Sparkles size={14} /> Your daily compass
                        </div>
                        <h1 className="font-display text-3xl font-bold tracking-[-0.04em] text-[#173e2a] sm:text-4xl">
                            Good {greeting}, {session.user.name?.split(" ")[0]}.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                            {nextAction
                                ? `Your next best move: ${nextAction.title}`
                                : todayProgress.total > 0
                                    ? "Today is complete. Protect the momentum."
                                    : "A clear day is a good place to choose one meaningful action."}
                        </p>
                    </div>
                    <button onClick={fetchGoals} disabled={isRefreshing} className="soft-button self-start md:self-auto">
                        <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                        {isRefreshing ? "Syncing" : "Refresh"}
                    </button>
                </section>

                {error && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

                <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <article className="metric-card metric-card-dark col-span-2 sm:col-span-1">
                        <div className="metric-icon bg-white/10 text-[#d9efc8]"><Target size={18} /></div>
                        <span className="metric-label text-white/60">Today</span>
                        <div className="flex items-end gap-2"><strong>{todayProgress.percentage}%</strong><span>{todayProgress.completed}/{todayProgress.total} done</span></div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#b7e38d] transition-all" style={{ width: `${todayProgress.percentage}%` }} /></div>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon bg-[#fff1d7] text-[#a16016]"><Flame size={18} /></div>
                        <span className="metric-label">Current streak</span>
                        <div className="flex items-end gap-2"><strong>{streak}</strong><span>{streak === 1 ? "day" : "days"}</span></div>
                        <p>Completed days in a row</p>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon bg-[#e6edf9] text-[#385d93]"><Check size={18} /></div>
                        <span className="metric-label">7-day consistency</span>
                        <div className="flex items-end gap-2"><strong>{consistency}%</strong><span>{weeklyCompleted}/{weeklyTotal}</span></div>
                        <div className="mt-3 flex items-end gap-1.5">
                            {week.map((day) => (
                                <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                                    <div className="flex h-7 w-full items-end rounded-sm bg-[#edf1eb]"><div className="w-full rounded-sm bg-[#7ea36f]" style={{ height: `${Math.max(day.percentage, day.total ? 14 : 3)}%` }} /></div>
                                    <span className="text-[9px] font-bold text-slate-400">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon bg-[#eee8f7] text-[#6e5596]"><Sparkles size={18} /></div>
                        <span className="metric-label">Active goals</span>
                        <div className="flex items-end gap-2"><strong>{goals.filter((goal) => goal.status !== "archived").length}</strong><span>in motion</span></div>
                        <p>Small actions compound</p>
                    </article>
                </section>

                <section id="calendar" className="grid scroll-mt-24 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
                    <div className="min-h-[610px] overflow-hidden rounded-[28px] border border-[#dfe6db] bg-white shadow-[0_18px_60px_rgba(38,67,48,0.07)]">
                        <Calendar goals={goals} selectedDate={selectedDate} onDateClick={setSelectedDate} />
                    </div>
                    <div className="min-h-[610px]">
                        <RightPanel
                            selectedDate={selectedDate}
                            goals={selectedDateGoals}
                            allGoals={goals}
                            onGoalAdded={fetchGoals}
                            onToggleGoal={toggleGoalStatus}
                            onDeleteGoal={deleteGoal}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}
