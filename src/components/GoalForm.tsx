"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Check, Flag, Repeat2, X } from "lucide-react";

interface GoalFormProps {
    selectedDate: Date;
    onGoalAdded: () => void;
    onCancel?: () => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: "S" }, { value: 1, label: "M" }, { value: 2, label: "T" },
    { value: 3, label: "W" }, { value: 4, label: "T" }, { value: 5, label: "F" },
    { value: 6, label: "S" },
];

const GOAL_TYPES = [
    { value: "daily", label: "One-time", helper: "A single action", icon: Check },
    { value: "short-term", label: "Habit", helper: "Repeat consistently", icon: Repeat2 },
    { value: "long-term", label: "Goal", helper: "A longer commitment", icon: Flag },
];

export default function GoalForm({ selectedDate, onGoalAdded, onCancel }: GoalFormProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("daily");
    const [startDate, setStartDate] = useState(format(selectedDate, "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState("");
    const [hasEndDate, setHasEndDate] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => setStartDate(format(selectedDate, "yyyy-MM-dd")), [selectedDate]);

    const isRecurring = type !== "daily";
    const toggleDay = (day: number) => setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort());

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        setError("");

        const goalData = {
            title: title.trim(),
            description: description.trim() || null,
            type,
            targetDate: type === "daily" ? format(selectedDate, "yyyy-MM-dd") : null,
            startDate: isRecurring ? startDate : undefined,
            endDate: isRecurring && hasEndDate && endDate ? endDate : null,
            recurringDays: isRecurring ? selectedDays : [],
        };

        try {
            const response = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(goalData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || "Could not add goal");

            onGoalAdded();
            onCancel?.();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Could not add goal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-[#dbe5d7] bg-[#f8faf6] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
                <div><h3 className="font-display text-lg font-bold text-[#1c462e]">Add to your plan</h3><p className="text-xs text-slate-500">Make the action clear and easy to start.</p></div>
                {onCancel && <button type="button" onClick={onCancel} aria-label="Close form" className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"><X size={18} /></button>}
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
                {GOAL_TYPES.map(({ value, label, helper, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setType(value)} className={`rounded-2xl border p-2.5 text-left transition ${type === value ? "border-[#3a6c48] bg-white shadow-sm" : "border-transparent bg-[#edf2ea] hover:bg-white"}`}>
                        <Icon size={16} className={type === value ? "text-[#2e6642]" : "text-slate-400"} />
                        <span className="mt-2 block text-xs font-bold text-slate-700">{label}</span>
                        <span className="hidden text-[9px] text-slate-400 sm:block">{helper}</span>
                    </button>
                ))}
            </div>

            <label className="form-label" htmlFor="goal-title">What will you do?</label>
            <input id="goal-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "short-term" ? "e.g. Walk for 20 minutes" : "e.g. Finish the project outline"} className="form-input" maxLength={120} required />

            <label className="form-label mt-3" htmlFor="goal-why">Why does this matter? <span>(optional)</span></label>
            <input id="goal-why" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short reminder for your future self" className="form-input" maxLength={240} />

            {isRecurring && (
                <div className="mt-4 space-y-4 border-t border-[#dfe7dc] pt-4">
                    <div>
                        <div className="mb-2 flex items-center justify-between"><span className="form-label mb-0">Repeat on</span><button type="button" onClick={() => setSelectedDays(selectedDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6])} className="text-[10px] font-bold text-[#386749]">{selectedDays.length === 7 ? "Clear" : "Every day"}</button></div>
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS_OF_WEEK.map((day, index) => <button key={index} type="button" aria-pressed={selectedDays.includes(day.value)} onClick={() => toggleDay(day.value)} className={`aspect-square rounded-full text-[11px] font-extrabold transition ${selectedDays.includes(day.value) ? "bg-[#245b3a] text-white shadow-sm" : "border border-[#d6e0d2] bg-white text-slate-500 hover:border-[#7f9c79]"}`}>{day.label}</button>)}
                        </div>
                        <p className="mt-2 text-[10px] text-slate-400">No days selected means every day.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label><span className="form-label"><CalendarDays size={12} /> Starts</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="form-input text-xs" required /></label>
                        <label><span className="form-label"><input type="checkbox" checked={hasEndDate} onChange={(event) => setHasEndDate(event.target.checked)} className="accent-[#285d3c]" /> End date</span><input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={!hasEndDate} className="form-input text-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" /></label>
                    </div>
                </div>
            )}

            {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="primary-button mt-4 w-full">{loading ? "Adding to your plan…" : "Add to plan"}</button>
        </form>
    );
}
