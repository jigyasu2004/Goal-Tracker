import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Goal, getCurrentStreak, getDayProgress, getWeekSnapshot, isGoalCompleteForDate } from "@/lib/goal-utils";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function safeDate(value: unknown) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date();
    const parsed = new Date(`${value}T12:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function extractOutputText(payload: unknown): string {
    if (!payload || typeof payload !== "object" || !("output" in payload) || !Array.isArray(payload.output)) return "";
    return payload.output
        .flatMap((item) => item && typeof item === "object" && "content" in item && Array.isArray(item.content) ? item.content : [])
        .filter((content) => content && typeof content === "object" && "type" in content && content.type === "output_text" && "text" in content && typeof content.text === "string")
        .map((content) => (content as { text: string }).text)
        .join("\n")
        .trim();
}

function localAdvice(goals: Goal[], date: Date, question: string) {
    const progress = getDayProgress(goals, date);
    const streak = getCurrentStreak(goals, date);
    const nextGoal = progress.scheduled.find((goal) => !isGoalCompleteForDate(goal, date));
    const asksAboutConsistency = /consisten|habit|streak|routine/i.test(question);
    const asksToBreakDown = /break|step|start|smaller/i.test(question);

    if (progress.total === 0) return "Pick one meaningful result for today and turn it into an action that takes 10–20 minutes. Schedule it before adding anything else.";
    if (progress.percentage === 100) return `Today is complete${streak ? ` and your current rhythm is ${streak} day${streak === 1 ? "" : "s"}` : ""}. Capture one sentence about what reduced friction, then repeat that condition tomorrow.`;
    if (nextGoal && asksToBreakDown) return `For “${nextGoal.title},” define a two-minute opening move: open the material, prepare the space, or complete the smallest visible unit. Stop planning after that and begin.`;
    if (asksAboutConsistency) return `Reduce the minimum version of your next habit until it is hard to skip. Complete “${nextGoal?.title || "your next action"}” at the same cue today, then record what made starting easier.`;
    return `Focus on “${nextGoal?.title || "your smallest useful action"}” next. Give it one distraction-free block, mark it complete, and only then decide what deserves your attention.`;
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const question = typeof body.question === "string" ? body.question.trim().slice(0, 280) : "";
        if (!question) return NextResponse.json({ message: "Ask the coach a short question." }, { status: 400 });

        const date = safeDate(body.date);
        const databaseGoals = await prisma.goal.findMany({
            where: { userId: session.user.id, status: { not: "archived" } },
            include: { completions: true },
            orderBy: { createdAt: "desc" },
        });
        const goals: Goal[] = databaseGoals.map((goal) => ({
            ...goal,
            targetDate: goal.targetDate?.toISOString() || null,
            startDate: goal.startDate.toISOString(),
            endDate: goal.endDate?.toISOString() || null,
            completions: goal.completions.map((completion) => ({ ...completion, date: completion.date.toISOString() })),
        }));
        const fallback = localAdvice(goals, date, question);

        if (!process.env.OPENAI_API_KEY) return NextResponse.json({ advice: fallback, mode: "local" });

        const progress = getDayProgress(goals, date);
        const week = getWeekSnapshot(goals, date);
        const scheduledSummary = progress.scheduled.map((goal) => ({
            title: goal.title,
            description: goal.description || undefined,
            type: goal.type,
            completed: isGoalCompleteForDate(goal, date),
        }));
        const weeklyCompleted = week.reduce((total, day) => total + day.completed, 0);
        const weeklyTotal = week.reduce((total, day) => total + day.total, 0);

        const response = await fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
                instructions: "You are Northstar Momentum Coach. Give concise, practical, non-judgmental goal coaching. Use the user's actual progress. Recommend one concrete next step and one friction-reducing tactic. Never claim to be a therapist or give medical advice. Keep the answer below 130 words and do not use markdown headings.",
                input: JSON.stringify({
                    userQuestion: question,
                    selectedDate: date.toISOString().slice(0, 10),
                    today: { completed: progress.completed, total: progress.total, percentage: progress.percentage },
                    currentStreak: getCurrentStreak(goals, date),
                    lastSevenDays: { completed: weeklyCompleted, total: weeklyTotal },
                    scheduledGoals: scheduledSummary,
                }),
                reasoning: { effort: "none" },
                text: { verbosity: "low" },
                max_output_tokens: 260,
                store: false,
            }),
            signal: AbortSignal.timeout(25_000),
        });

        if (!response.ok) {
            console.error("OpenAI coach request failed:", response.status);
            return NextResponse.json({ advice: fallback, mode: "local" });
        }

        const advice = extractOutputText(await response.json());
        return NextResponse.json({ advice: advice || fallback, mode: advice ? "ai" : "local" });
    } catch (error) {
        console.error("Momentum coach error:", error);
        return NextResponse.json({ message: "The coach is temporarily unavailable." }, { status: 500 });
    }
}
