"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { Goal, getDayProgress } from "@/lib/goal-utils";

interface CalendarProps {
    goals: Goal[];
    selectedDate: Date;
    onDateClick: (date: Date) => void;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function Calendar({ goals, selectedDate, onDateClick }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

    useEffect(() => {
        if (!isSameMonth(selectedDate, currentMonth)) setCurrentMonth(startOfMonth(selectedDate));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const days = useMemo(() => eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth)),
    }), [currentMonth]);

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(startOfMonth(today));
        onDateClick(today);
    };

    return (
        <div className="relative flex h-full flex-col overflow-hidden p-4 sm:p-6">
            <div className="pointer-events-none absolute -left-20 top-10 h-48 w-48 rounded-full bg-[#5338c8]/10 blur-3xl" />
            <header className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="eyebrow"><Activity size={12} /> Temporal activity</span>
                    <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white">{format(currentMonth, "MMMM yyyy")}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={goToToday} className="rounded-xl border border-white/[0.09] bg-white/[0.025] px-3.5 py-2 text-xs font-bold text-[#aab3cd] transition hover:border-[#62e5dd]/30 hover:bg-[#62e5dd]/[0.07] hover:text-[#8df7ef]">Live</button>
                    <button aria-label="Previous month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="calendar-nav"><ChevronLeft size={17} /></button>
                    <button aria-label="Next month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="calendar-nav"><ChevronRight size={17} /></button>
                </div>
            </header>

            <div className="relative z-10 mb-2 grid grid-cols-7 gap-1 sm:gap-2">
                {WEEKDAYS.map((weekday) => <div key={weekday} className="py-1 text-center text-[8px] font-black tracking-[0.16em] text-[#535c77] sm:text-[9px]">{weekday}</div>)}
            </div>

            <div className="relative z-10 grid flex-1 auto-rows-fr grid-cols-7 gap-1 sm:gap-2">
                {days.map((day) => {
                    const progress = getDayProgress(goals, day);
                    const selected = isSameDay(day, selectedDate);
                    const current = isSameMonth(day, currentMonth);
                    const complete = progress.total > 0 && progress.completed === progress.total;
                    const nextGoal = progress.scheduled.find((goal) => !goal.completions?.some((completion) => completion.completed && isSameDay(new Date(completion.date), day)));

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDateClick(day)}
                            aria-label={`${format(day, "MMMM d")}, ${progress.completed} of ${progress.total} complete`}
                            className={clsx(
                                "group relative flex min-h-[62px] flex-col overflow-hidden rounded-xl border p-1.5 text-left transition duration-300 sm:min-h-[78px] sm:rounded-2xl sm:p-2.5 lg:min-h-[86px]",
                                selected
                                    ? "border-[#69e5e0]/45 bg-gradient-to-br from-[#123d55]/90 via-[#233b72]/85 to-[#442b76]/85 text-white shadow-[0_10px_35px_rgba(43,101,179,.28),inset_0_1px_0_rgba(255,255,255,.12)]"
                                    : current
                                        ? "border-white/[0.065] bg-white/[0.02] text-[#c1c8da] hover:-translate-y-0.5 hover:border-[#8a7cff]/25 hover:bg-white/[0.045] hover:shadow-[0_10px_30px_rgba(25,42,94,.18)]"
                                        : "border-transparent bg-transparent text-[#3d455e] hover:bg-white/[0.015]",
                            )}
                        >
                            {selected && <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7ff7ed] to-transparent shadow-[0_0_12px_rgba(94,234,212,.8)]" />}
                            <div className="flex w-full items-start justify-between">
                                <span className={clsx("flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold sm:h-7 sm:w-7 sm:text-sm", isToday(day) && !selected && "border border-[#5eead4]/25 bg-[#5eead4]/10 text-[#85f7ed] shadow-[0_0_18px_rgba(94,234,212,.12)]")}>{format(day, "d")}</span>
                                {progress.total > 0 && <span className={clsx("hidden text-[8px] font-extrabold sm:block", selected ? "text-[#b8fff8]" : complete ? "text-[#66e6d9]" : "text-[#68728d]")}>{progress.completed}/{progress.total}</span>}
                            </div>

                            <div className="mt-auto w-full">
                                {progress.total > 0 ? (
                                    <>
                                        <div className={clsx("mb-1.5 hidden truncate text-[8px] font-semibold sm:block", selected ? "text-white/65" : "text-[#69738e]")}>{complete ? "Sequence complete" : nextGoal?.title || "In progress"}</div>
                                        <div className={clsx("h-1 overflow-hidden rounded-full", selected ? "bg-white/10" : "bg-white/[0.055]")}>
                                            <div className={clsx("h-full rounded-full transition-all", complete ? "bg-gradient-to-r from-[#42d9c6] to-[#75f7e9] shadow-[0_0_10px_rgba(94,234,212,.65)]" : "bg-gradient-to-r from-[#5c73dd] to-[#b06de4]")} style={{ width: `${progress.percentage}%` }} />
                                        </div>
                                    </>
                                ) : <span className="hidden text-[8px] font-medium uppercase tracking-wider text-[#343c54] sm:block">No signal</span>}
                            </div>
                        </button>
                    );
                })}
            </div>

            <footer className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.065] pt-4 text-[10px] text-[#5e6782]">
                <span>Select a node to plan, check in, or reflect.</span>
                <div className="flex gap-3"><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#9b6de0] shadow-[0_0_8px_#9b6de0]" /> Active</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#5eead4] shadow-[0_0_8px_#5eead4]" /> Complete</span></div>
            </footer>
        </div>
    );
}
