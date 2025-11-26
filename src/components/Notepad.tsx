"use client";

import { useState, useEffect } from "react";

interface Goal {
    id: string;
    title: string;
}



export default function Notepad() {
    const [content, setContent] = useState("");
    const [selectedGoalId, setSelectedGoalId] = useState<string>("");
    const [goals, setGoals] = useState<Goal[]>([]);
    const [saving, setSaving] = useState(false);
    const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    useEffect(() => {
        const fetchNote = async () => {
            const url = selectedGoalId
                ? `/api/notes?goalId=${selectedGoalId}`
                : `/api/notes`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const note = data[0];
                if (note) {
                    setContent(note.content);
                    setCurrentNoteId(note.id);
                } else {
                    setContent("");
                    setCurrentNoteId(null);
                }
            }
        };
        fetchNote();
    }, [selectedGoalId]);

    const fetchGoals = async () => {
        const res = await fetch("/api/goals");
        if (res.ok) {
            const data = await res.json();
            setGoals(data);
        }
    };

    // Helper to refresh note after save
    const refreshNote = async () => {
        const url = selectedGoalId
            ? `/api/notes?goalId=${selectedGoalId}`
            : `/api/notes`;

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const note = data[0];
            if (note) {
                setContent(note.content);
                setCurrentNoteId(note.id);
            }
        }
    };

    const saveNote = async () => {
        setSaving(true);
        setSaved(false);
        const method = currentNoteId ? "PUT" : "POST";
        const body = {
            content,
            goalId: selectedGoalId || null,
            ...(currentNoteId && { id: currentNoteId }),
        };

        await fetch("/api/notes", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!currentNoteId) {
            await refreshNote();
        }
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="h-full rounded-2xl bg-white p-6 shadow-xl border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📝</span>
                        <h3 className="text-2xl font-bold text-gray-800">Notes</h3>
                    </div>
                    <button
                        onClick={saveNote}
                        disabled={saving}
                        className={
                            saved
                                ? "rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-lg bg-green-600"
                                : saving
                                    ? "rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 opacity-50 cursor-not-allowed"
                                    : "rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-200 shadow-md hover:shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        }
                    >
                        {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Note"}
                    </button>
                </div>

                {/* Goal selector */}
                <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-800 font-medium transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-gradient-to-r from-purple-50 to-blue-50"
                >
                    <option value="">📋 General Notes</option>
                    {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                            🎯 {goal.title}
                        </option>
                    ))}
                </select>
            </div>

            {/* Notepad area */}
            <div className="flex-1 relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full resize-none rounded-lg border-2 border-gray-200 p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition bg-gradient-to-br from-yellow-50 to-orange-50"
                    placeholder={
                        selectedGoalId
                            ? "Write notes for this goal..."
                            : "Write your thoughts, ideas, and plans here..."
                    }
                    style={{
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                        fontSize: "15px",
                        lineHeight: "1.6",
                    }}
                />

                {/* Decorative notepad lines effect */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg overflow-hidden">
                    <div className="absolute left-12 top-0 bottom-0 w-px bg-red-200"></div>
                </div>
            </div>

            {/* Footer info */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{content.length} characters</span>
                {selectedGoalId && (
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                        Linked to goal
                    </span>
                )}
            </div>
        </div>
    );
}
