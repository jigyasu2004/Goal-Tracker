import {
    eachDayOfInterval,
    getDay,
    isAfter,
    isBefore,
    isSameDay,
    startOfDay,
    subDays,
} from "date-fns";

export interface GoalCompletion {
    id: string;
    date: string;
    completed: boolean;
}

export interface Goal {
    id: string;
    title: string;
    description?: string | null;
    targetDate: string | null;
    startDate: string;
    endDate: string | null;
    recurringDays: string | null;
    status: string;
    type: string;
    completions?: GoalCompletion[];
}

export function parseRecurringDays(value: string | null | undefined): number[] {
    if (!value) return [];

    try {
        let parsed: unknown = JSON.parse(value);

        // Keep goals created by the older double-encoding client working.
        if (typeof parsed === "string") parsed = JSON.parse(parsed);

        return Array.isArray(parsed)
            ? parsed.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)
            : [];
    } catch {
        return [];
    }
}

export function isGoalScheduledForDate(goal: Goal, date: Date): boolean {
    const day = startOfDay(date);

    if (goal.status === "archived") return false;

    if (goal.type === "daily") {
        return Boolean(goal.targetDate && isSameDay(new Date(goal.targetDate), day));
    }

    const start = startOfDay(new Date(goal.startDate));
    const end = goal.endDate ? startOfDay(new Date(goal.endDate)) : null;

    if (isBefore(day, start) || (end && isAfter(day, end))) return false;

    const recurringDays = parseRecurringDays(goal.recurringDays);
    return recurringDays.length === 0 || recurringDays.includes(getDay(day));
}

export function goalsForDate(goals: Goal[], date: Date): Goal[] {
    return goals.filter((goal) => isGoalScheduledForDate(goal, date));
}

export function isGoalCompleteForDate(goal: Goal, date: Date): boolean {
    if (goal.status === "completed" && goal.type === "daily") return true;

    return Boolean(
        goal.completions?.some(
            (completion) => completion.completed && isSameDay(new Date(completion.date), date),
        ),
    );
}

export function getDayProgress(goals: Goal[], date: Date) {
    const scheduled = goalsForDate(goals, date);
    const completed = scheduled.filter((goal) => isGoalCompleteForDate(goal, date)).length;
    const percentage = scheduled.length === 0 ? 0 : Math.round((completed / scheduled.length) * 100);

    return { scheduled, completed, total: scheduled.length, percentage };
}

export function getCurrentStreak(goals: Goal[], today = new Date()): number {
    let streak = 0;

    for (let offset = 0; offset < 365; offset += 1) {
        const date = subDays(startOfDay(today), offset);
        const progress = getDayProgress(goals, date);

        // A day in progress should not erase the completed run behind it.
        if (offset === 0 && progress.total > 0 && progress.completed < progress.total) continue;
        if (progress.total === 0) continue;
        if (progress.completed !== progress.total) break;
        streak += 1;
    }

    return streak;
}

export function getWeekSnapshot(goals: Goal[], today = new Date()) {
    const end = startOfDay(today);
    const start = subDays(end, 6);

    return eachDayOfInterval({ start, end }).map((date) => ({
        date,
        label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
        ...getDayProgress(goals, date),
    }));
}
