"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { Check, CheckCircle2, Circle, Flag, NotebookPen, Plus, Repeat2, Sparkles, Trash2 } from "lucide-react";
import GoalForm from "./GoalForm";
import { Goal, isGoalCompleteForDate, parseRecurringDays } from "@/lib/goal-utils";

interface Note {
    id: string;
    title: string | null;
    content: string;
    goalId: string | null;
    noteDate: string | null;
}

interface RightPanelProps {
    selectedDate: Date;
    goals: Goal[];
    allGoals: Goal[];
    onGoalAdded: () => void;
    onToggleGoal: (id: string, status: string, date?: Date) => void;
    onDeleteGoal: (id: string) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RightPanel({ selectedDate, goals, allGoals, onGoalAdded, onToggleGoal, onDeleteGoal }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<"plan" | "notes">("plan");
    const [showGoalForm, setShowGoalForm] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [noteType, setNoteType] = useState<"general" | "date" | "goal">("date");
    const [selectedGoalId, setSelectedGoalId] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [noteError, setNoteError] = useState("");

    const completed = useMemo(() => goals.filter((goal) => isGoalCompleteForDate(goal, selectedDate)).length, [goals, selectedDate]);
    const progress = goals.length === 0 ? 0 : Math.round((completed / goals.length) * 100);

    useEffect(() => setShowGoalForm(false), [selectedDate]);

    const getNoteUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (noteType === "date") params.set("noteDate", format(selectedDate, "yyyy-MM-dd"));
        if (noteType === "goal" && selectedGoalId) params.set("goalId", selectedGoalId);
        return `/api/notes${params.toString() ? `?${params.toString()}` : ""}`;
    }, [noteType, selectedDate, selectedGoalId]);

    const refreshNotes = useCallback(async () => {
        if (noteType === "goal" && !selectedGoalId) {
            setNotes([]);
            return;
        }
        const response = await fetch(getNoteUrl(), { cache: "no-store" });
        if (!response.ok) return;
        const data: Note[] = await response.json();
        setNotes(noteType === "general" ? data.filter((note) => !note.goalId && !note.noteDate) : data);
    }, [getNoteUrl, noteType, selectedGoalId]);

    useEffect(() => { refreshNotes(); }, [refreshNotes]);

    const resetNoteForm = () => {
        setNoteTitle(""); setNoteContent(""); setEditingNoteId(null); setNoteError("");
    };

    const saveNote = async () => {
        if (!noteContent.trim()) return;
        if (noteType === "goal" && !selectedGoalId) {
            setNoteError("Choose a goal for this note.");
            return;
        }

        setSaving(true);
        setNoteError("");
        const body: Record<string, string | null> = { title: noteTitle.trim() || null, content: noteContent.trim() };
        if (editingNoteId) body.id = editingNoteId;
        if (noteType === "date") body.noteDate = format(selectedDate, "yyyy-MM-dd");
        if (noteType === "goal") body.goalId = selectedGoalId;

        const response = await fetch("/api/notes", {
            method: editingNoteId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        setSaving(false);

        if (!response.ok) {
            setNoteError("Your reflection could not be saved.");
            return;
        }
        resetNoteForm();
        refreshNotes();
    };

    const deleteNote = async (id: string) => {
        const response = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (response.ok) refreshNotes();
    };

    const changeNoteType = (type: "general" | "date" | "goal") => {
        setNoteType(type); resetNoteForm();
    };

    return (
        <div className="flex h-full min-h-[610px] flex-col overflow-hidden rounded-[28px] border border-[#dfe6db] bg-white shadow-[0_18px_60px_rgba(38,67,48,0.07)]">
            <header className="border-b border-[#edf0ea] px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f8e7b]">{isSameDay(selectedDate, new Date()) ? "Today" : format(selectedDate, "EEEE")}</span><h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#183d2a]">{format(selectedDate, "MMMM d")}</h2><p className="mt-1 text-xs text-slate-400">{completed} of {goals.length} actions complete</p></div>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `conic-gradient(#5d8b59 ${progress * 3.6}deg, #e8ede5 0deg)` }}><div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-xs font-extrabold text-[#315c3e]">{progress}%</div></div>
                </div>
                <nav className="flex gap-6" aria-label="Day details">
                    <button onClick={() => setActiveTab("plan")} className={`panel-tab ${activeTab === "plan" ? "panel-tab-active" : ""}`}>Plan <span>{goals.length}</span></button>
                    <button onClick={() => setActiveTab("notes")} className={`panel-tab ${activeTab === "notes" ? "panel-tab-active" : ""}`}>Reflect <NotebookPen size={13} /></button>
                </nav>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {activeTab === "plan" ? (
                    <div className="space-y-4">
                        {showGoalForm ? <GoalForm selectedDate={selectedDate} onGoalAdded={onGoalAdded} onCancel={() => setShowGoalForm(false)} /> : <button onClick={() => setShowGoalForm(true)} className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-[#b8c9b3] bg-[#f7faf5] px-4 py-3 text-left transition hover:border-[#5d815c] hover:bg-[#f1f7ed]"><span><strong className="block text-sm text-[#2a5237]">Add an action</strong><small className="text-[11px] text-slate-400">One-time task, habit, or longer goal</small></span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#295d3d] text-white transition group-hover:rotate-90"><Plus size={16} /></span></button>}

                        {goals.length === 0 ? (
                            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf4e9] text-[#59805a]"><Sparkles size={23} /></div><h3 className="font-display text-lg font-bold text-[#264d34]">Make this day intentional</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Choose one small action. A plan you can repeat beats a perfect plan you cannot start.</p>{!showGoalForm && <button onClick={() => setShowGoalForm(true)} className="soft-button mt-5"><Plus size={15} /> Add your first action</button>}</div>
                        ) : (
                            <div className="space-y-2.5">
                                {goals.map((goal) => {
                                    const isCompleted = isGoalCompleteForDate(goal, selectedDate);
                                    const days = parseRecurringDays(goal.recurringDays);
                                    const Icon = goal.type === "short-term" ? Repeat2 : goal.type === "long-term" ? Flag : Check;
                                    return (
                                        <article key={goal.id} className={`goal-row group ${isCompleted ? "goal-row-complete" : ""}`}>
                                            <button onClick={() => onToggleGoal(goal.id, isCompleted ? "pending" : "completed", selectedDate)} aria-label={isCompleted ? `Mark ${goal.title} incomplete` : `Complete ${goal.title}`} className={`goal-check ${isCompleted ? "goal-check-complete" : ""}`}>{isCompleted ? <Check size={17} strokeWidth={3} /> : <Circle size={20} />}</button>
                                            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className={`truncate text-sm font-bold ${isCompleted ? "text-slate-400 line-through" : "text-slate-700"}`}>{goal.title}</h3><Icon size={12} className={goal.type === "short-term" ? "text-[#7a559b]" : goal.type === "long-term" ? "text-[#b16a35]" : "text-[#4f7c59]"} /></div>{goal.description && <p className="mt-0.5 truncate text-[11px] text-slate-400">{goal.description}</p>}<div className="mt-1.5 flex gap-2 text-[9px] font-bold uppercase tracking-wide text-slate-400"><span>{goal.type === "daily" ? "One-time" : goal.type === "short-term" ? "Habit" : "Goal"}</span>{days.length > 0 && <span>• {days.map((day) => DAY_LABELS[day]).join(" · ")}</span>}</div></div>
                                            <button onClick={() => { if (window.confirm(`Delete “${goal.title}”?`)) onDeleteGoal(goal.id); }} aria-label={`Delete ${goal.title}`} className="rounded-full p-2 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"><Trash2 size={15} /></button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {goals.length > 0 && completed === goals.length && <div className="flex items-center gap-3 rounded-2xl border border-[#cee1c5] bg-[#f0f7eb] p-4 text-[#386142]"><CheckCircle2 size={21} /><div><strong className="block text-sm">Day complete</strong><span className="text-[11px] text-[#638069]">Take a moment to notice what helped.</span></div></div>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-[#f7f8f4] p-1"><div className="grid grid-cols-3 gap-1">{([['general','General'], ['date','This day'], ['goal','A goal']] as const).map(([value, label]) => <button key={value} onClick={() => changeNoteType(value)} className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${noteType === value ? "bg-white text-[#315d3e] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{label}</button>)}</div></div>
                        {noteType === "goal" && <select value={selectedGoalId} onChange={(event) => setSelectedGoalId(event.target.value)} className="form-input text-sm"><option value="">Choose a goal…</option>{allGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select>}
                        <div className="rounded-3xl border border-[#e2e5d9] bg-[#fffdf6] p-4 shadow-[0_8px_30px_rgba(70,65,42,.05)]"><input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Reflection title (optional)" className="w-full border-0 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:font-medium placeholder:text-slate-300" /><textarea value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="What worked? What got in the way? What will you try next?" className="mt-3 h-28 w-full resize-none border-0 bg-transparent text-sm leading-6 text-slate-600 outline-none placeholder:text-slate-300" /><div className="mt-3 flex items-center justify-between border-t border-[#ebe7d8] pt-3"><span className="text-[10px] text-slate-400">{noteContent.length} characters</span><button onClick={saveNote} disabled={saving || !noteContent.trim()} className="primary-button px-4 py-2 text-xs">{saving ? "Saving…" : editingNoteId ? "Update" : "Save reflection"}</button></div>{noteError && <p className="mt-2 text-xs text-red-600">{noteError}</p>}</div>
                        <div><h3 className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Past reflections</h3>{notes.length === 0 ? <p className="rounded-2xl border border-dashed border-[#dce2d8] py-8 text-center text-xs text-slate-400">Nothing here yet. Your future self will thank you for a note.</p> : <div className="space-y-2">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-[#e9e9df] bg-white p-3.5"><div className="flex items-start justify-between gap-3"><div>{note.title && <h4 className="text-xs font-bold text-slate-700">{note.title}</h4>}<p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-500">{note.content}</p></div><button onClick={() => deleteNote(note.id)} aria-label="Delete reflection" className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></div><button onClick={() => { setNoteTitle(note.title || ""); setNoteContent(note.content); setEditingNoteId(note.id); }} className="mt-2 text-[10px] font-bold text-[#4e7556]">Edit reflection</button></article>)}</div>}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
