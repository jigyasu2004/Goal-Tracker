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
    } catch {
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
        } else {
            // Otherwise update main goal status (legacy/simple goals)
            await prisma.goal.update({
                where: { id },
                data: { status },
            });
        }

        // --- INSTANT REWARD CHECK ---
        const userId = session.user.id;
        const checkDate = date ? new Date(date) : new Date();

        const start = new Date(checkDate); start.setHours(0, 0, 0, 0);
        const end = new Date(checkDate); end.setHours(23, 59, 59, 999);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { goals: true }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (user && (user as any).email) {
            const today = new Date();

            // Reset count if last reward was not today
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let currentCount = (user as any).rewardEmailCount;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const lastReward = new Date((user as any).lastRewardDate);
            const lastRewardIsToday = lastReward.getDate() === today.getDate() &&
                lastReward.getMonth() === today.getMonth() &&
                lastReward.getFullYear() === today.getFullYear();

            if (!lastRewardIsToday) {
                currentCount = 0;
            }

            if (currentCount < 2) {
                // Filter goals relevant for checkDate
                const goalsForDate = user.goals.filter(goal => {
                    if (goal.status === 'archived') return false;

                    // Check if targetDate matches checkDate
                    if (goal.targetDate) {
                        const target = new Date(goal.targetDate);
                        return target.getDate() === checkDate.getDate() &&
                            target.getMonth() === checkDate.getMonth() &&
                            target.getFullYear() === checkDate.getFullYear();
                    }

                    // Check recurring days
                    if (goal.recurringDays) {
                        try {
                            const days = JSON.parse(goal.recurringDays);
                            const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
                            return days.includes(dayName);
                        } catch {
                            return false;
                        }
                    }

                    return true;
                });

                let allComplete = true;

                for (const g of goalsForDate) {
                    const completion = await prisma.goalCompletion.findFirst({
                        where: {
                            goalId: g.id,
                            date: { gte: start, lte: end },
                            completed: true
                        }
                    });
                    const isGloballyComplete = g.status === 'completed';
                    if (!completion && !isGloballyComplete) {
                        allComplete = false;
                        break;
                    }
                }

                if (allComplete && goalsForDate.length > 0) {
                    // Send Email
                    const { sendEmail } = await import("@/lib/email");
                    const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;

                    await sendEmail(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (user as any).email,
                        `Reward Unlocked: All goals completed for ${checkDate.toLocaleDateString()}!`,
                        `
                         <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Great Job, ${user.username}!</h2>
                            <p>You have completed all your goals for <strong>${checkDate.toLocaleDateString()}</strong>.</p>
                            <p>Keep up the momentum!</p>
                            <p>
                              <a href="${dashboardUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
                            </p>
                         </div>
                         `
                    );

                    // Update count
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            rewardEmailCount: currentCount + 1,
                            lastRewardDate: new Date()
                        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
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
    } catch {
        return NextResponse.json({ error: "Error deleting goal" }, { status: 500 });
    }
}
