import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const GOAL_TYPES = new Set(["daily", "short-term", "long-term"]);
const GOAL_STATUSES = new Set(["pending", "completed", "archived"]);

function dateOnly(value: unknown): Date | null {
    if (typeof value !== "string" || !value) return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function recurringDays(value: unknown): number[] {
    try {
        let parsed: unknown = value;
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        if (typeof parsed === "string") parsed = JSON.parse(parsed);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6);
    } catch {
        return [];
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const type = new URL(req.url).searchParams.get("type");

    try {
        const goals = await prisma.goal.findMany({
            where: { userId: session.user.id, ...(type && GOAL_TYPES.has(type) ? { type } : {}) },
            include: { completions: true, notes: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        return NextResponse.json({ error: "Error fetching goals" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const description = typeof body.description === "string" ? body.description.trim() : "";

        if (!title || title.length > 120) return NextResponse.json({ message: "Enter a goal title under 120 characters." }, { status: 400 });
        if (!GOAL_TYPES.has(body.type)) return NextResponse.json({ message: "Choose a valid goal type." }, { status: 400 });

        const targetDate = dateOnly(body.targetDate);
        const startDate = dateOnly(body.startDate) || targetDate || new Date();
        const endDate = dateOnly(body.endDate);

        if (body.type === "daily" && !targetDate) return NextResponse.json({ message: "Choose a date for this action." }, { status: 400 });
        if (endDate && endDate < startDate) return NextResponse.json({ message: "End date must be after the start date." }, { status: 400 });

        const goal = await prisma.goal.create({
            data: {
                title,
                description: description ? description.slice(0, 240) : null,
                type: body.type,
                targetDate: body.type === "daily" ? targetDate : null,
                startDate,
                endDate,
                recurringDays: body.type === "daily" ? null : JSON.stringify(recurringDays(body.recurringDays)),
                userId: session.user.id,
            },
        });

        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error("Error creating goal:", error);
        return NextResponse.json({ error: "Error creating goal" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { id, status, date } = await req.json();
        if (typeof id !== "string" || !GOAL_STATUSES.has(status)) return NextResponse.json({ message: "Invalid update." }, { status: 400 });

        const goal = await prisma.goal.findFirst({ where: { id, userId: session.user.id } });
        if (!goal) return NextResponse.json({ message: "Goal not found." }, { status: 404 });

        if (date) {
            const completionDate = dateOnly(date);
            if (!completionDate) return NextResponse.json({ message: "Invalid completion date." }, { status: 400 });

            await prisma.goalCompletion.upsert({
                where: { goalId_date: { goalId: goal.id, date: completionDate } },
                update: { completed: status === "completed" },
                create: { goalId: goal.id, date: completionDate, completed: status === "completed" },
            });
        } else {
            await prisma.goal.update({ where: { id: goal.id }, data: { status } });
        }

        // Notifications must never make a successful check-in appear to fail.
        try {
            await maybeSendReward(session.user.id, dateOnly(date) || new Date());
        } catch (notificationError) {
            console.error("Completion reward email failed:", notificationError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating goal:", error);
        return NextResponse.json({ error: "Error updating goal" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await req.json();
        if (typeof id !== "string") return NextResponse.json({ message: "Missing ID" }, { status: 400 });

        const result = await prisma.goal.deleteMany({ where: { id, userId: session.user.id } });
        if (result.count === 0) return NextResponse.json({ message: "Goal not found" }, { status: 404 });
        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("Error deleting goal:", error);
        return NextResponse.json({ error: "Error deleting goal" }, { status: 500 });
    }
}

async function maybeSendReward(userId: string, checkDate: Date) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { goals: { include: { completions: true } } } });
    if (!user?.email) return;

    const localToday = new Date().toLocaleDateString("en-CA", { timeZone: user.timezone || "UTC" });
    const lastRewardDay = user.lastRewardDate.toLocaleDateString("en-CA", { timeZone: user.timezone || "UTC" });
    const rewardCount = localToday === lastRewardDay ? user.rewardEmailCount : 0;
    if (rewardCount >= 1) return;

    const dayOfWeek = checkDate.getUTCDay();
    const relevantGoals = user.goals.filter((goal) => {
        if (goal.status === "archived") return false;
        if (goal.type === "daily") return Boolean(goal.targetDate && goal.targetDate.toISOString().slice(0, 10) === checkDate.toISOString().slice(0, 10));
        if (checkDate < goal.startDate || (goal.endDate && checkDate > goal.endDate)) return false;
        const days = recurringDays(goal.recurringDays);
        return days.length === 0 || days.includes(dayOfWeek);
    });

    if (relevantGoals.length === 0) return;
    const allComplete = relevantGoals.every((goal) => goal.status === "completed" || goal.completions.some((completion) => completion.completed && completion.date.toISOString().slice(0, 10) === checkDate.toISOString().slice(0, 10)));
    if (!allComplete) return;

    const { sendEmail } = await import("@/lib/email");
    const dashboardUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard`;
    await sendEmail(user.email, "Your day is complete — keep the momentum", `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243b2b"><h2>Beautiful work, ${escapeHtml(user.username)}.</h2><p>You completed every planned action for today. Consistency is built exactly like this: one honest day at a time.</p><p><a href="${dashboardUrl}" style="display:inline-block;background:#285d3c;color:white;padding:11px 18px;text-decoration:none;border-radius:9px">View your progress</a></p></div>`);
    await prisma.user.update({ where: { id: userId }, data: { rewardEmailCount: rewardCount + 1, lastRewardDate: new Date() } });
}

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}
