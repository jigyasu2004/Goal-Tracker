"use client";

import { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay,
    addMonths,
    subMonths,
    isWithinInterval,
    getDay,
} from "date-fns";
import clsx from "clsx";

interface GoalCompletion {
    id: string;
    date: string;
    completed: boolean;
}

interface Goal {
    id: string;
    title: string;
    targetDate: string | null;
    startDate: string;
    endDate: string | null;
    recurringDays: string | null;
    type: string;
    completions?: GoalCompletion[];
}

interface CalendarProps {
    goals: Goal[];
    onDateClick: (date: Date) => void;
}

export default function Calendar({ goals, onDateClick }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getGoalsForDate = (date: Date) => {
        return goals.filter((goal) => {
            if (goal.type === "daily" || (!goal.startDate && !goal.endDate && !goal.recurringDays)) {
                return goal.targetDate && isSameDay(new Date(goal.targetDate), date);
            }

            const goalStartDate = new Date(goal.startDate);
            const goalEndDate = goal.endDate ? new Date(goal.endDate) : null;

            const isInDateRange = goalEndDate
                ? isWithinInterval(date, { start: goalStartDate, end: goalEndDate })
                : date >= goalStartDate;

            if (!isInDateRange) return false;

            if (goal.recurringDays) {
                try {
                    const selectedDays: number[] = JSON.parse(goal.recurringDays);
                    const dayOfWeek = getDay(date);
                    return selectedDays.includes(dayOfWeek);
                } catch {
                    return true;
                }
            }

            return true;
        });
    };

    const getGoalStatusForDate = (goal: Goal, date: Date) => {
        if (!goal.completions) return false;
        // Check if there is a completion record for this specific date
        const completion = goal.completions.find(c => isSameDay(new Date(c.date), date));
        return completion ? completion.completed : false;
    };

    const getGoalColor = (type: string) => {
        switch (type) {
            case "daily":
                return "bg-gradient-to-r from-green-400 to-emerald-500";
            case "short-term":
                return "bg-gradient-to-r from-blue-400 to-cyan-500";
            case "long-term":
                return "bg-gradient-to-r from-purple-400 to-pink-500";
            default:
                return "bg-gray-400";
        }
    };

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
        onDateClick(day);
    };

    return (
        <div className="h-full rounded-2xl bg-white p-3 shadow-xl border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">
                    {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="rounded-lg bg-purple-100 p-1.5 text-purple-600 transition hover:bg-purple-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="rounded-lg bg-purple-100 p-1.5 text-purple-600 transition hover:bg-purple-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-[10px] font-bold text-gray-600">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 grid grid-cols-7 gap-1 overflow-auto content-start">
                {days.map((day) => {
                    const dayGoals = getGoalsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    // Only show status symbols for past dates (excluding today)
                    const isPastDate = day < new Date() && !isTodayDate;

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => handleDateClick(day)}
                            className={clsx(
                                "relative min-h-[60px] lg:min-h-[90px] rounded-lg p-1 lg:p-1.5 text-left transition-all",
                                {
                                    "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md": isTodayDate,
                                    "bg-gray-50 hover:bg-gray-100": !isTodayDate && isCurrentMonth && !isSelected,
                                    "bg-gray-50/50 text-gray-400": !isCurrentMonth,
                                    "ring-2 ring-purple-400 bg-purple-50": isSelected && !isTodayDate,
                                    "hover:shadow-sm": isCurrentMonth,
                                }
                            )}
                        >
                            <div className={clsx("text-xs font-semibold mb-1", {
                                "text-white": isTodayDate,
                                "text-gray-800": !isTodayDate && isCurrentMonth,
                            })}>
                                {format(day, "d")}
                            </div>

                            {/* Goal titles */}
                            <div className="space-y-0.5">
                                {dayGoals.slice(0, 2).map((goal) => {
                                    const isCompleted = getGoalStatusForDate(goal, day);

                                    return (
                                        <div
                                            key={goal.id}
                                            className={clsx(
                                                "rounded px-1 py-0.5 text-[9px] font-medium text-white shadow-sm flex items-center justify-between",
                                                getGoalColor(goal.type),
                                                { "opacity-60": isPastDate && !isCompleted }
                                            )}
                                            title={goal.title}
                                        >
                                            {/* Desktop: Show Title */}
                                            <span className="hidden lg:block truncate">{goal.title}</span>

                                            {/* Mobile: Show Dot */}
                                            <span className="block lg:hidden h-1.5 w-1.5 rounded-full bg-white mx-auto"></span>

                                            {isPastDate && (
                                                <span className="hidden lg:inline ml-1 text-[8px]">
                                                    {isCompleted ? "✅" : "❌"}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                {dayGoals.length > 2 && (
                                    <div className="text-[9px] font-semibold text-purple-600 bg-purple-100 rounded px-1 py-0.5 text-center">
                                        <span className="hidden lg:inline">+{dayGoals.length - 2} more</span>
                                        <span className="lg:hidden">+{dayGoals.length - 2}</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex gap-2 border-t border-gray-200 pt-2">
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <span className="text-[9px] text-gray-600">Daily</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                    <span className="text-[9px] text-gray-600">Short</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
                    <span className="text-[9px] text-gray-600">Long</span>
                </div>
            </div>
        </div>
    );
}
