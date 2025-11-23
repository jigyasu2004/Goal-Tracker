"use client";

import { useState, useEffect } from "react";

interface Goal {
    id: string;
    title: string;
    status: string;
}

interface GoalListProps {
    title: string;
    type: string;
}

export default function GoalList({ title, type }: GoalListProps) {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newGoal, setNewGoal] = useState("");

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        const res = await fetch(`/api/goals?type=${type}`);
        if (res.ok) {
            const data = await res.json();
            setGoals(data);
        }
    };

    const addGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.trim()) return;

        const res = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newGoal, type }),
        });

        if (res.ok) {
            setNewGoal("");
            fetchGoals();
        }
    };

    const toggleGoal = async (id: string, status: string) => {
        const newStatus = status === "completed" ? "pending" : "completed";
        const res = await fetch(`/api/goals`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: newStatus }),
        });

        if (res.ok) {
            fetchGoals();
        }
    };

    const deleteGoal = async (id: string) => {
        const res = await fetch(`/api/goals?id=${id}`, {
            method: "DELETE",
        });

        if (res.ok) {
            fetchGoals();
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow-md">
            <h3 className="mb-4 text-xl font-bold text-gray-800">{title}</h3>
            <form onSubmit={addGoal} className="mb-4 flex gap-2">
                <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add a new goal..."
                    className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="rounded bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
                >
                    Add
                </button>
            </form>
            <ul className="space-y-2">
                {goals.map((goal) => (
                    <li
                        key={goal.id}
                        className="flex items-center justify-between rounded bg-gray-50 p-3"
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={goal.status === "completed"}
                                onChange={() => toggleGoal(goal.id, goal.status)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                                className={`text-gray-800 ${goal.status === "completed" ? "line-through text-gray-400" : ""
                                    }`}
                            >
                                {goal.title}
                            </span>
                        </div>
                        <button
                            onClick={() => deleteGoal(goal.id)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
