"use client";

import { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import GoalForm from "./GoalForm";

interface GoalCompletion {
    id: string;
    date: string;
    completed: boolean;
}

interface Goal {
    id: string;
    title: string;
    status: string;
    type: string;
    recurringDays: string | null;
    completions?: GoalCompletion[];
}

interface Note {
    id: string;
    title: string | null;
    content: string;
    goalId: string | null;
    noteDate: string | null;
}

interface RightPanelProps {
    selectedDate: Date | null;
    goals: Goal[];
    onGoalAdded: () => void;
    onToggleGoal: (id: string, status: string, date?: Date) => void;
    onDeleteGoal: (id: string) => void;
}

export default function RightPanel({
    selectedDate,
    goals,
    onGoalAdded,
    onToggleGoal,
    onDeleteGoal,
}: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<"goals" | "notes">("goals");
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [noteType, setNoteType] = useState<"general" | "date" | "goal">("general");
    const [selectedGoalId, setSelectedGoalId] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            let url = "/api/notes";
            const params = new URLSearchParams();

            if (noteType === "date" && selectedDate) {
                params.append("noteDate", selectedDate.toISOString());
            } else if (noteType === "goal" && selectedGoalId) {
                params.append("goalId", selectedGoalId);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (noteType === "general") {
                    setNotes(data.filter((n: Note) => !n.goalId && !n.noteDate));
                } else {
                    setNotes(data);
                }
            }
        };
        fetchNotes();
    }, [selectedDate, noteType, selectedGoalId]);

    // Helper for manual refresh
    const refreshNotes = async () => {
        let url = "/api/notes";
        const params = new URLSearchParams();

        if (noteType === "date" && selectedDate) {
            params.append("noteDate", selectedDate.toISOString());
        } else if (noteType === "goal" && selectedGoalId) {
            params.append("goalId", selectedGoalId);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (noteType === "general") {
                setNotes(data.filter((n: Note) => !n.goalId && !n.noteDate));
            } else {
                setNotes(data);
            }
        }
    };

    const saveNote = async () => {
        if (!noteContent.trim()) return;

        setSaving(true);
        const method = editingNoteId ? "PUT" : "POST";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: any = {
            title: noteTitle || null,
            content: noteContent,
        };

        if (editingNoteId) {
            body.id = editingNoteId;
        }

        if (noteType === "date" && selectedDate) {
            body.noteDate = selectedDate.toISOString();
        } else if (noteType === "goal" && selectedGoalId) {
            body.goalId = selectedGoalId;
        }

        await fetch("/api/notes", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        setSaving(false);
        setNoteTitle("");
        setNoteContent("");
        setEditingNoteId(null);
        refreshNotes();
    };

    const editNote = (note: Note) => {
        setNoteTitle(note.title || "");
        setNoteContent(note.content);
        setEditingNoteId(note.id);
    };

    const deleteNote = async (id: string) => {
        await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
        refreshNotes();
    };

    if (!selectedDate) {
        return (
            <div className="h-full rounded-2xl bg-white p-8 shadow-xl border border-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Date</h3>
                    <p className="text-gray-500">Click on any date in the calendar to get started</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full rounded-2xl bg-white shadow-xl border border-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 text-white flex-shrink-0">
                <h2 className="text-lg font-bold">{format(selectedDate, "EEE, MMM d, yyyy")}</h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
                <button
                    onClick={() => setActiveTab("goals")}
                    className={`flex-1 py-3 lg:py-2 text-sm font-semibold transition-all ${activeTab === "goals"
                        ? "bg-purple-50 text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    🎯 Goals
                </button>
                <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 py-3 lg:py-2 text-sm font-semibold transition-all ${activeTab === "notes"
                        ? "bg-purple-50 text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                >
                    📝 Notes
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3">
                {activeTab === "goals" ? (
                    <div className="space-y-3">
                        <GoalForm selectedDate={selectedDate} onGoalAdded={onGoalAdded} />

                        <div>
                            <h3 className="text-xs font-semibold text-gray-700 mb-2">Today&apos;s Goals</h3>
                            {goals.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-4">No goals for this date</p>
                            ) : (
                                <ul className="space-y-2">
                                    {goals.map((goal) => {
                                        // Check if completed for this specific date
                                        const isCompleted = selectedDate && goal.completions?.some(
                                            c => isSameDay(new Date(c.date), selectedDate) && c.completed
                                        );

                                        return (
                                            <li key={goal.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 lg:p-2 border border-gray-200">
                                                <div className="flex items-center gap-3 lg:gap-2 flex-1">
                                                    <button
                                                        onClick={() => onToggleGoal(goal.id, isCompleted ? "pending" : "completed", selectedDate || undefined)}
                                                        className={`flex h-6 w-6 lg:h-4 lg:w-4 items-center justify-center rounded-full border-2 transition-all ${isCompleted ? "bg-green-500 border-green-500" : "border-gray-300"
                                                            }`}
                                                    >
                                                        {isCompleted && (
                                                            <svg className="h-3.5 w-3.5 lg:h-2.5 lg:w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <span className={`text-sm lg:text-xs ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>
                                                        {goal.title}
                                                    </span>
                                                </div>
                                                <button onClick={() => onDeleteGoal(goal.id)} className="text-red-500 hover:text-red-700 p-1">
                                                    <svg className="h-4 w-4 lg:h-3 lg:w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Note Type Selector */}
                        <div>
                            <label className="block text-[10px] font-semibold text-gray-700 mb-1">Note Type</label>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setNoteType("general")}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${noteType === "general" ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    📋 General
                                </button>
                                <button
                                    onClick={() => setNoteType("date")}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${noteType === "date" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    📅 Date
                                </button>
                                <button
                                    onClick={() => setNoteType("goal")}
                                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${noteType === "goal" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    🎯 Goal
                                </button>
                            </div>
                        </div>

                        {/* Goal Selector */}
                        {noteType === "goal" && (
                            <select
                                value={selectedGoalId}
                                onChange={(e) => setSelectedGoalId(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-200 px-2 py-1.5 text-xs text-gray-800"
                            >
                                <option value="">Select a goal...</option>
                                {goals.map((goal) => (
                                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                                ))}
                            </select>
                        )}

                        {/* Note Form */}
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                                placeholder="Note title (optional)"
                                className="w-full rounded-lg border-2 border-gray-200 px-2 py-1.5 text-xs text-gray-800"
                            />
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Write your note..."
                                className="w-full h-24 resize-none rounded-lg border-2 border-gray-200 px-2 py-1.5 text-xs text-gray-800"
                            />
                            <button
                                onClick={saveNote}
                                disabled={saving}
                                className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : editingNoteId ? "Update Note" : "Save Note"}
                            </button>
                        </div>

                        {/* Notes List - Scrollable */}
                        <div className="max-h-64 overflow-y-auto">
                            <h3 className="text-xs font-semibold text-gray-700 mb-2 sticky top-0 bg-white pb-1">Saved Notes</h3>
                            {notes.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-4">No notes yet</p>
                            ) : (
                                <ul className="space-y-2">
                                    {notes.map((note) => (
                                        <li key={note.id} className="rounded-lg bg-yellow-50 p-2 border border-yellow-200">
                                            {note.title && <h4 className="font-semibold text-gray-800 text-xs mb-1">{note.title}</h4>}
                                            <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{note.content}</p>
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => editNote(note)} className="text-[10px] text-blue-600 hover:underline">
                                                    Edit
                                                </button>
                                                <button onClick={() => deleteNote(note.id)} className="text-[10px] text-red-600 hover:underline">
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
