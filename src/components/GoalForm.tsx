"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

interface GoalFormProps {
    selectedDate: Date;
    onGoalAdded: () => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: "Sun" },
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
];

export default function GoalForm({ selectedDate, onGoalAdded }: GoalFormProps) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("daily");
    const [startDate, setStartDate] = useState(format(selectedDate, "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    // Update startDate when selectedDate changes
    useEffect(() => {
        setStartDate(format(selectedDate, "yyyy-MM-dd"));
    }, [selectedDate]);

    const isRecurring = type === "short-term" || type === "long-term";

    const toggleDay = (day: number) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort()
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);

        const goalData: any = {
            title,
            type,
            targetDate: selectedDate.toISOString(),
        };

        if (isRecurring) {
            goalData.startDate = new Date(startDate).toISOString();
            goalData.endDate = hasEndDate && endDate ? new Date(endDate).toISOString() : null;
            goalData.recurringDays = selectedDays.length > 0 ? JSON.stringify(selectedDays) : null;
        }

        const res = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goalData),
        });

        setLoading(false);

        if (res.ok) {
            setTitle("");
            setSelectedDays([]);
            setHasEndDate(false);
            setEndDate("");
            onGoalAdded();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Type and Title */}
            <div className="flex gap-2">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="rounded-lg border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                    <option value="daily">🌅 Daily</option>
                    <option value="short-term">📆 Short-term</option>
                    <option value="long-term">🏔️ Long-term</option>
                </select>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new goal..."
                    className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                />
            </div>

            {/* Recurring Options (only for short-term and long-term) */}
            {isRecurring && (
                <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-4 space-y-4 border border-purple-100">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span>🔄</span> Recurring Settings
                    </h4>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                <input
                                    type="checkbox"
                                    checked={hasEndDate}
                                    onChange={(e) => setHasEndDate(e.target.checked)}
                                    className="mr-2"
                                />
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                disabled={!hasEndDate}
                                className="w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Days of Week Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Repeat on (optional - leave empty for all days)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedDays.includes(day.value)
                                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md scale-105"
                                        : "bg-white text-gray-600 border-2 border-gray-200 hover:border-purple-300"
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        {selectedDays.length > 0 && (
                            <p className="text-xs text-gray-600 mt-2">
                                Selected: {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ")}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-bold text-white hover:from-purple-600 hover:to-blue-600 shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Adding..." : "+ Add Goal"}
            </button>
        </form>
    );
}
