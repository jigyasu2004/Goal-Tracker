import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    try {
        const goals = await prisma.goal.findMany({
            where: {
                userId: session.user.id,
                ...(type ? { type } : {}),
            },
            include: {
                completions: true,
                notes: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(goals);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching goals" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, type, targetDate, startDate, endDate, recurringDays } = await req.json();

        const goal = await prisma.goal.create({
            data: {
                title,
                type,
                targetDate: targetDate ? new Date(targetDate) : null,
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                recurringDays: recurringDays ? JSON.stringify(recurringDays) : null,
                userId: session.user.id,
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        console.error("Error creating goal:", error);
        return NextResponse.json({ error: "Error creating goal" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, status, date } = await req.json();

        // If a date is provided, we are toggling a specific completion
        if (date) {
            const completionDate = new Date(date);

            // Check if completion exists
            const existingCompletion = await prisma.goalCompletion.findUnique({
                where: {
                    goalId_date: {
                        goalId: id,
                        date: completionDate,
                    },
                },
            });

            if (existingCompletion) {
                // Toggle existing
                await prisma.goalCompletion.update({
                    where: { id: existingCompletion.id },
                    data: { completed: status === "completed" },
                });
            } else {
                // Create new
                await prisma.goalCompletion.create({
                    data: {
                        goalId: id,
                        date: completionDate,
                        completed: status === "completed",
                    },
                });
            }

            return NextResponse.json({ success: true });
        }

        // Otherwise update main goal status (legacy/simple goals)
        const goal = await prisma.goal.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(goal);
    } catch (error) {
        return NextResponse.json({ error: "Error updating goal" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ message: "Missing ID" }, { status: 400 });
        }

        await prisma.goal.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Error deleting goal" }, { status: 500 });
    }
}
