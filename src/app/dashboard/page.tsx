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
            <div className="space-grid flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-[#38405d] border-r-[#5eead4] border-t-[#a78bfa] shadow-[0_0_30px_rgba(94,234,212,.2)]" />
                    <p className="text-sm font-semibold text-[#8992ad]">Synchronizing your orbit…</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    return (
        <div className="space-grid min-h-screen overflow-hidden text-[#edf1ff]">
            <div className="aurora-orb pointer-events-none fixed -left-40 top-20 h-80 w-80 rounded-full bg-[#4b3bcc]/15" />
            <div className="aurora-orb aurora-orb-delayed pointer-events-none fixed -right-32 top-72 h-72 w-72 rounded-full bg-[#10bfc6]/10" />
            <Navbar />
            <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 pb-10 pt-7 sm:px-6 lg:px-8">
                <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <div className="eyebrow mb-2">
                            <span className="status-dot" /> Mission control
                        </div>
                        <h1 className="gradient-text font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                            Good {greeting}, {session.user.name?.split(" ")[0]}.
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-[#858eaa] sm:text-base">
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

                {error && <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-200">{error}</div>}

                <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <article className="metric-card metric-card-dark col-span-2 sm:col-span-1">
                        <div className="metric-icon text-[#8afff5]"><Target size={18} /></div>
                        <span className="metric-label text-white/60">Today</span>
                        <div className="flex items-end gap-2"><strong>{todayProgress.percentage}%</strong><span>{todayProgress.completed}/{todayProgress.total} done</span></div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#5eead4] to-[#a78bfa] shadow-[0_0_14px_rgba(94,234,212,.8)] transition-all" style={{ width: `${todayProgress.percentage}%` }} /></div>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon text-[#f4a261]"><Flame size={18} /></div>
                        <span className="metric-label">Current streak</span>
                        <div className="flex items-end gap-2"><strong>{streak}</strong><span>{streak === 1 ? "day" : "days"}</span></div>
                        <p>Completed days in a row</p>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon text-[#68d7ff]"><Check size={18} /></div>
                        <span className="metric-label">7-day consistency</span>
                        <div className="flex items-end gap-2"><strong>{consistency}%</strong><span>{weeklyCompleted}/{weeklyTotal}</span></div>
                        <div className="mt-3 flex items-end gap-1.5">
                            {week.map((day) => (
                                <div key={day.date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                                    <div className="flex h-7 w-full items-end rounded-sm bg-white/[0.05]"><div className="w-full rounded-sm bg-gradient-to-t from-[#5576dc] to-[#62e8df] shadow-[0_0_10px_rgba(94,234,212,.16)]" style={{ height: `${Math.max(day.percentage, day.total ? 14 : 3)}%` }} /></div>
                                    <span className="text-[9px] font-bold text-[#5d6680]">{day.label}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                    <article className="metric-card">
                        <div className="metric-icon text-[#b69cff]"><Sparkles size={18} /></div>
                        <span className="metric-label">Active goals</span>
                        <div className="flex items-end gap-2"><strong>{goals.filter((goal) => goal.status !== "archived").length}</strong><span>in motion</span></div>
                        <p>Small actions compound</p>
                    </article>
                </section>

                <section id="calendar" className="grid scroll-mt-24 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
                    <div className="glass-panel min-h-[610px] overflow-hidden rounded-[28px]">
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
