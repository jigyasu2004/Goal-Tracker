"use client";

import { useEffect, useMemo, useState } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        // Only selectedDate should move the displayed month.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        return eachDayOfInterval({
            start: startOfWeek(monthStart),
            end: endOfWeek(monthEnd),
        });
    }, [currentMonth]);

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(startOfMonth(today));
        onDateClick(today);
    };

    return (
        <div className="flex h-full flex-col p-4 sm:p-6">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f8e7b]">Progress calendar</span>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#183d2a]">{format(currentMonth, "MMMM yyyy")}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={goToToday} className="rounded-full border border-[#dce4d8] px-3.5 py-2 text-xs font-bold text-[#41634a] transition hover:bg-[#f2f6ef]">Today</button>
                    <button aria-label="Previous month" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="calendar-nav"><ChevronLeft size={17} /></button>
                    <button aria-label="Next month" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="calendar-nav"><ChevronRight size={17} /></button>
                </div>
            </header>

            <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
                {WEEKDAYS.map((weekday) => <div key={weekday} className="py-1 text-center text-[9px] font-extrabold tracking-[0.12em] text-slate-400 sm:text-[10px]">{weekday}</div>)}
            </div>

            <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-1 sm:gap-2">
                {days.map((day) => {
                    const progress = getDayProgress(goals, day);
                    const selected = isSameDay(day, selectedDate);
                    const current = isSameMonth(day, currentMonth);
                    const complete = progress.total > 0 && progress.completed === progress.total;

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onDateClick(day)}
                            aria-label={`${format(day, "MMMM d")}, ${progress.completed} of ${progress.total} complete`}
                            className={clsx(
                                "group relative flex min-h-[62px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[78px] sm:rounded-2xl sm:p-2.5 lg:min-h-[86px]",
                                selected
                                    ? "border-[#295c3c] bg-[#214b33] text-white shadow-[0_8px_24px_rgba(30,73,47,.2)]"
                                    : current
                                        ? "border-[#edf0ea] bg-[#fbfcfa] text-[#294436] hover:-translate-y-0.5 hover:border-[#bfcdb9] hover:shadow-md"
                                        : "border-transparent bg-transparent text-slate-300 hover:bg-slate-50",
                            )}
                        >
                            <div className="flex w-full items-start justify-between">
                                <span className={clsx("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold sm:h-7 sm:w-7 sm:text-sm", isToday(day) && !selected && "bg-[#dff0d1] text-[#295b39]")}>{format(day, "d")}</span>
                                {progress.total > 0 && <span className={clsx("hidden text-[9px] font-bold sm:block", selected ? "text-white/65" : complete ? "text-[#4d7b53]" : "text-slate-400")}>{progress.completed}/{progress.total}</span>}
                            </div>

                            <div className="mt-auto w-full">
                                {progress.total > 0 ? (
                                    <>
                                        <div className={clsx("mb-1 hidden truncate text-[9px] font-semibold sm:block", selected ? "text-white/70" : "text-slate-500")}>
                                            {complete ? "Day complete" : progress.scheduled.find((goal) => !goal.completions?.some((completion) => completion.completed && isSameDay(new Date(completion.date), day)))?.title || "In progress"}
                                        </div>
                                        <div className={clsx("h-1 overflow-hidden rounded-full", selected ? "bg-white/15" : "bg-[#e6ebe3]")}>
                                            <div className={clsx("h-full rounded-full transition-all", complete ? "bg-[#91c66c]" : selected ? "bg-[#d6eba7]" : "bg-[#e7a958]")} style={{ width: `${progress.percentage}%` }} />
                                        </div>
                                    </>
                                ) : <span className="hidden text-[9px] text-slate-300 sm:block">Open day</span>}
                            </div>
                        </button>
                    );
                })}
            </div>

            <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#edf0ea] pt-4 text-[11px] text-slate-400">
                <span>Select a day to plan, check in, or reflect.</span>
                <div className="flex gap-3"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e7a958]" /> In progress</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#91c66c]" /> Complete</span></div>
            </footer>
        </div>
    );
}
