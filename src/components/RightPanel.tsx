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
        <div className="glass-panel flex h-full min-h-[610px] flex-col overflow-hidden rounded-[28px]">
            <header className="relative border-b border-white/[0.07] px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
                <div className="pointer-events-none absolute right-4 top-0 h-28 w-28 rounded-full bg-[#6d4fe0]/10 blur-3xl" />
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="relative"><span className="eyebrow">{isSameDay(selectedDate, new Date()) ? <><span className="status-dot" /> Live node</> : format(selectedDate, "EEEE")}</span><h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white">{format(selectedDate, "MMMM d")}</h2><p className="mt-1 text-xs text-[#68728d]">{completed} of {goals.length} actions synchronized</p></div>
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_0_28px_rgba(94,234,212,.12)]" style={{ background: `conic-gradient(#5eead4 ${progress * 3.6}deg, #a78bfa ${progress * 3.6}deg, rgba(255,255,255,.07) 0deg)` }}><div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#0b0d1a] text-xs font-extrabold text-[#b8fff8]">{progress}%</div></div>
                </div>
                <nav className="flex gap-6" aria-label="Day details">
                    <button onClick={() => setActiveTab("plan")} className={`panel-tab ${activeTab === "plan" ? "panel-tab-active" : ""}`}>Plan <span>{goals.length}</span></button>
                    <button onClick={() => setActiveTab("notes")} className={`panel-tab ${activeTab === "notes" ? "panel-tab-active" : ""}`}>Reflect <NotebookPen size={13} /></button>
                </nav>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {activeTab === "plan" ? (
                    <div className="space-y-4">
                        {showGoalForm ? <GoalForm selectedDate={selectedDate} onGoalAdded={onGoalAdded} onCancel={() => setShowGoalForm(false)} /> : <button onClick={() => setShowGoalForm(true)} className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-[#6876a0]/30 bg-white/[0.02] px-4 py-3 text-left transition hover:border-[#5eead4]/35 hover:bg-[#5eead4]/[0.035]"><span><strong className="block text-sm text-[#dbe3f8]">Initialize an action</strong><small className="text-[11px] text-[#626b86]">One-time task, habit, or longer mission</small></span><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#159ca8] to-[#6548bd] text-white shadow-[0_0_20px_rgba(80,112,218,.25)] transition group-hover:rotate-90"><Plus size={16} /></span></button>}

                        {goals.length === 0 ? (
                            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a78bfa]/20 bg-gradient-to-br from-[#5eead4]/10 to-[#a78bfa]/15 text-[#9afff6] shadow-[0_0_30px_rgba(94,234,212,.1)]"><Sparkles size={23} /></div><h3 className="font-display text-lg font-bold text-white">No mission assigned</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#707a96]">Choose one small action. A repeatable signal beats a perfect plan you cannot launch.</p>{!showGoalForm && <button onClick={() => setShowGoalForm(true)} className="soft-button mt-5"><Plus size={15} /> Initialize first action</button>}</div>
                        ) : (
                            <div className="space-y-2.5">
                                {goals.map((goal) => {
                                    const isCompleted = isGoalCompleteForDate(goal, selectedDate);
                                    const days = parseRecurringDays(goal.recurringDays);
                                    const Icon = goal.type === "short-term" ? Repeat2 : goal.type === "long-term" ? Flag : Check;
                                    return (
                                        <article key={goal.id} className={`goal-row group ${isCompleted ? "goal-row-complete" : ""}`}>
                                            <button onClick={() => onToggleGoal(goal.id, isCompleted ? "pending" : "completed", selectedDate)} aria-label={isCompleted ? `Mark ${goal.title} incomplete` : `Complete ${goal.title}`} className={`goal-check ${isCompleted ? "goal-check-complete" : ""}`}>{isCompleted ? <Check size={17} strokeWidth={3} /> : <Circle size={20} />}</button>
                                            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className={`truncate text-sm font-bold ${isCompleted ? "text-[#626c87] line-through" : "text-[#dfe5f5]"}`}>{goal.title}</h3><Icon size={12} className={goal.type === "short-term" ? "text-[#b38cf3]" : goal.type === "long-term" ? "text-[#f0a567]" : "text-[#62e7dd]"} /></div>{goal.description && <p className="mt-0.5 truncate text-[11px] text-[#69728e]">{goal.description}</p>}<div className="mt-1.5 flex gap-2 text-[9px] font-bold uppercase tracking-wide text-[#515a74]"><span>{goal.type === "daily" ? "One-time" : goal.type === "short-term" ? "Habit" : "Goal"}</span>{days.length > 0 && <span>• {days.map((day) => DAY_LABELS[day]).join(" · ")}</span>}</div></div>
                                            <button onClick={() => { if (window.confirm(`Delete “${goal.title}”?`)) onDeleteGoal(goal.id); }} aria-label={`Delete ${goal.title}`} className="rounded-full p-2 text-[#4f5871] opacity-0 transition hover:bg-red-400/[0.08] hover:text-red-300 group-hover:opacity-100 focus:opacity-100"><Trash2 size={15} /></button>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {goals.length > 0 && completed === goals.length && <div className="flex items-center gap-3 rounded-2xl border border-[#5eead4]/20 bg-gradient-to-r from-[#5eead4]/[0.08] to-[#a78bfa]/[0.07] p-4 text-[#8df8ee] shadow-[0_0_28px_rgba(94,234,212,.07)]"><CheckCircle2 size={21} /><div><strong className="block text-sm">Sequence complete</strong><span className="text-[11px] text-[#718aa0]">Capture what helped before this signal fades.</span></div></div>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-white/[0.06] bg-[#070916]/70 p-1"><div className="grid grid-cols-3 gap-1">{([['general','General'], ['date','This day'], ['goal','A goal']] as const).map(([value, label]) => <button key={value} onClick={() => changeNoteType(value)} className={`rounded-xl px-2 py-2 text-[11px] font-bold transition ${noteType === value ? "border border-white/[0.07] bg-gradient-to-r from-[#15626e]/40 to-[#563e94]/40 text-[#b9fff8] shadow-sm" : "text-[#626c87] hover:text-[#aeb7ce]"}`}>{label}</button>)}</div></div>
                        {noteType === "goal" && <select value={selectedGoalId} onChange={(event) => setSelectedGoalId(event.target.value)} className="form-input text-sm"><option value="">Choose a goal…</option>{allGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select>}
                        <div className="rounded-3xl border border-[#9ba8e5]/15 bg-[#080a18]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.03)]"><input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Reflection title (optional)" className="w-full border-0 bg-transparent text-sm font-bold text-[#e4e9f8] outline-none placeholder:font-medium placeholder:text-[#434b64]" /><textarea value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="What worked? What got in the way? What will you try next?" className="mt-3 h-28 w-full resize-none border-0 bg-transparent text-sm leading-6 text-[#a2abc4] outline-none placeholder:text-[#434b64]" /><div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="text-[10px] text-[#515b76]">{noteContent.length} characters</span><button onClick={saveNote} disabled={saving || !noteContent.trim()} className="primary-button px-4 py-2 text-xs">{saving ? "Saving…" : editingNoteId ? "Update" : "Save reflection"}</button></div>{noteError && <p className="mt-2 text-xs text-red-300">{noteError}</p>}</div>
                        <div><h3 className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#5c6681]">Memory archive</h3>{notes.length === 0 ? <p className="rounded-2xl border border-dashed border-[#6a7390]/25 py-8 text-center text-xs text-[#5e6782]">No data archived. Leave a signal for your future self.</p> : <div className="space-y-2">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5"><div className="flex items-start justify-between gap-3"><div>{note.title && <h4 className="text-xs font-bold text-[#dbe2f4]">{note.title}</h4>}<p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#808aa5]">{note.content}</p></div><button onClick={() => deleteNote(note.id)} aria-label="Delete reflection" className="text-[#4c5570] hover:text-red-300"><Trash2 size={14} /></button></div><button onClick={() => { setNoteTitle(note.title || ""); setNoteContent(note.content); setEditingNoteId(note.id); }} className="mt-2 text-[10px] font-bold text-[#70e6dd]">Edit reflection</button></article>)}</div>}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
