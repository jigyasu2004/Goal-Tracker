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
        <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-3xl border border-[#8e9ee5]/15 bg-[#090b1a]/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:p-5">
            <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[#704fd1]/15 blur-3xl" />
            <div className="mb-4 flex items-center justify-between">
                <div className="relative"><span className="eyebrow">New sequence</span><h3 className="mt-1 font-display text-lg font-bold text-white">Initialize an action</h3><p className="text-xs text-[#68718d]">Define a signal that is clear and easy to launch.</p></div>
                {onCancel && <button type="button" onClick={onCancel} aria-label="Close form" className="relative rounded-xl border border-white/[0.07] p-2 text-[#67708a] transition hover:bg-white/[0.05] hover:text-white"><X size={18} /></button>}
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
                {GOAL_TYPES.map(({ value, label, helper, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setType(value)} className={`rounded-2xl border p-2.5 text-left transition ${type === value ? "border-[#62e6df]/35 bg-gradient-to-br from-[#15616e]/30 to-[#533b91]/30 shadow-[0_0_24px_rgba(94,234,212,.08)]" : "border-white/[0.06] bg-white/[0.025] hover:border-[#8c7ef0]/25 hover:bg-white/[0.045]"}`}>
                        <Icon size={16} className={type === value ? "text-[#79f4eb]" : "text-[#59627d]"} />
                        <span className="mt-2 block text-xs font-bold text-[#dce3f5]">{label}</span>
                        <span className="hidden text-[9px] text-[#5e6782] sm:block">{helper}</span>
                    </button>
                ))}
            </div>

            <label className="form-label" htmlFor="goal-title">What will you do?</label>
            <input id="goal-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === "short-term" ? "e.g. Walk for 20 minutes" : "e.g. Finish the project outline"} className="form-input" maxLength={120} required />

            <label className="form-label mt-3" htmlFor="goal-why">Why does this matter? <span>(optional)</span></label>
            <input id="goal-why" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short reminder for your future self" className="form-input" maxLength={240} />

            {isRecurring && (
                <div className="mt-4 space-y-4 border-t border-white/[0.07] pt-4">
                    <div>
                        <div className="mb-2 flex items-center justify-between"><span className="form-label mb-0">Repeat on</span><button type="button" onClick={() => setSelectedDays(selectedDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6])} className="text-[10px] font-bold text-[#70e8df]">{selectedDays.length === 7 ? "Clear" : "Every day"}</button></div>
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS_OF_WEEK.map((day, index) => <button key={index} type="button" aria-pressed={selectedDays.includes(day.value)} onClick={() => toggleDay(day.value)} className={`aspect-square rounded-xl text-[11px] font-extrabold transition ${selectedDays.includes(day.value) ? "border border-[#5eead4]/25 bg-gradient-to-br from-[#16828c] to-[#5b45a1] text-white shadow-[0_0_16px_rgba(94,234,212,.14)]" : "border border-white/[0.07] bg-white/[0.025] text-[#69728c] hover:border-[#7a83aa]"}`}>{day.label}</button>)}
                        </div>
                        <p className="mt-2 text-[10px] text-[#545d77]">No nodes selected means every day.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label><span className="form-label"><CalendarDays size={12} /> Starts</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="form-input text-xs" required /></label>
                        <label><span className="form-label"><input type="checkbox" checked={hasEndDate} onChange={(event) => setHasEndDate(event.target.checked)} className="accent-[#5eead4]" /> End date</span><input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={!hasEndDate} className="form-input text-xs disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:text-[#414960]" /></label>
                    </div>
                </div>
            )}

            {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="primary-button mt-4 w-full">{loading ? "Adding to your plan…" : "Add to plan"}</button>
        </form>
    );
}
