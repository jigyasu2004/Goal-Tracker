"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Calendar from "@/components/Calendar";
import RightPanel from "@/components/RightPanel";
import { getDay, format } from "date-fns";

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
    status: string;
    type: string;
    completions?: GoalCompletion[];
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session) {
            fetchGoals();
        }
    }, [session]);

    const fetchGoals = async () => {
        console.log("Fetching goals...");
        try {
            const res = await fetch("/api/goals", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched goals:", data.length);
                setGoals(data);
            } else {
                console.error("Failed to fetch goals");
            }
        } catch (error) {
            console.error("Error fetching goals:", error);
        }
    };

    const toggleGoalStatus = async (goalId: string, currentStatus: string, date?: Date) => {
        // Optimistic Update
        const previousGoals = [...goals];
        setGoals(currentGoals =>
            currentGoals.map(g => {
                if (g.id !== goalId) return g;

                // If toggling a specific date (daily completion)
                if (date) {
                    const dateStr = date.toISOString();
                    const completions = g.completions || [];
                    const existingIndex = completions.findIndex(c => c.date === dateStr);

                    let newCompletions;
                    if (existingIndex >= 0) {
                        // Toggle existing
                        newCompletions = [...completions];
                        newCompletions[existingIndex] = {
                            ...newCompletions[existingIndex],
                            completed: currentStatus === "completed"
                        };
                    } else {
                        // Add new
                        newCompletions = [...completions, {
                            id: "temp-" + Date.now(),
                            date: dateStr,
                            completed: currentStatus === "completed"
                        }];
                    }
                    return { ...g, completions: newCompletions };
                }

                // If toggling main status
                return { ...g, status: currentStatus };
            })
        );

        try {
            const res = await fetch("/api/goals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: goalId,
                    status: currentStatus,
                    date: date ? date.toISOString() : undefined
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update");
            }

            // Optional: Fetch to ensure sync, but optimistic update makes it feel instant
            // fetchGoals(); 
        } catch (error) {
            console.error("Error updating goal:", error);
            // Revert on error
            setGoals(previousGoals);
        }
    };

    const deleteGoal = async (goalId: string) => {
        await fetch("/api/goals", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: goalId }),
        });
        fetchGoals();
    };

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                <div className="text-center">
                    <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const selectedDateGoals = selectedDate
        ? goals.filter((g) => {
            // Normalize selected date to YYYY-MM-DD for string comparison
            const selectedDateStr = format(selectedDate, "yyyy-MM-dd");

            // Daily goals or simple goals (check targetDate)
            if (g.type === "daily" || (!g.startDate && !g.endDate && !g.recurringDays)) {
                if (!g.targetDate) return false;
                return format(new Date(g.targetDate), "yyyy-MM-dd") === selectedDateStr;
            }

            // Recurring/Long-term goals
            const goalStartDateStr = format(new Date(g.startDate), "yyyy-MM-dd");
            const goalEndDateStr = g.endDate ? format(new Date(g.endDate), "yyyy-MM-dd") : null;

            // Check if selected date is after or equal to start date
            if (selectedDateStr < goalStartDateStr) return false;

            // Check if selected date is before or equal to end date (if exists)
            if (goalEndDateStr && selectedDateStr > goalEndDateStr) return false;

            // Check recurring days
            if (g.recurringDays) {
                try {
                    const selectedDays: number[] = JSON.parse(g.recurringDays);
                    const dayOfWeek = getDay(selectedDate);
                    return selectedDays.includes(dayOfWeek);
                } catch {
                    return true;
                }
            }

            return true;
        })
        : [];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
            <Navbar />
            <main className="flex-1 container mx-auto p-4 lg:overflow-hidden lg:h-[calc(100vh-5rem)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    <div className="h-[500px] lg:h-full overflow-hidden rounded-2xl shadow-xl border border-gray-100 bg-white">
                        <Calendar goals={goals} onDateClick={setSelectedDate} />
                    </div>
                    <div className="h-[600px] lg:h-full">
                        <RightPanel
                            selectedDate={selectedDate}
                            goals={selectedDateGoals}
                            onGoalAdded={fetchGoals}
                            onToggleGoal={toggleGoalStatus}
                            onDeleteGoal={deleteGoal}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
