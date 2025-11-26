import cron from 'node-cron';
import { prisma } from './prisma';
import { sendEmail } from './email';
import { startOfDay, endOfDay } from 'date-fns';
import crypto from 'crypto';

export function initScheduler() {
    // Run every day at 9 PM
    cron.schedule('0 21 * * *', async () => {
        console.log('Running daily goal check...');
        await checkGoalsAndNotify();
    });
}

export async function checkGoalsAndNotify() {
    try {
        const users = await prisma.user.findMany({
            include: {
                goals: true,
            },
        });

        const today = new Date();
        const start = startOfDay(today);
        const end = endOfDay(today);

        for (const user of users) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(user as any).email) continue;

            // Find goals active today
            const goalsForToday = user.goals.filter(goal => {
                if (goal.status === 'archived') return false;

                // Check if targetDate matches today
                if (goal.targetDate) {
                    const target = new Date(goal.targetDate);
                    return target.getDate() === today.getDate() &&
                        target.getMonth() === today.getMonth() &&
                        target.getFullYear() === today.getFullYear();
                }

                // Check recurring days
                if (goal.recurringDays) {
                    try {
                        const days = JSON.parse(goal.recurringDays);
                        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
                        return days.includes(dayName);
                    } catch {
                        return false;
                    }
                }

                // If no date/recurring specified, assume it's a general goal active every day until completed?
                // Or maybe strictly require a date. For now, let's assume general goals are always active.
                return true;
            });

            if (goalsForToday.length === 0) continue;

            let allCompleted = true;
            const incompleteGoals: string[] = [];

            for (const goal of goalsForToday) {
                // Check if completed today via GoalCompletion
                const completion = await prisma.goalCompletion.findFirst({
                    where: {
                        goalId: goal.id,
                        date: {
                            gte: start,
                            lte: end,
                        },
                        completed: true,
                    },
                });

                // Also check if the goal itself is marked as completed (for one-off goals without specific dates)
                const isGloballyCompleted = goal.status === 'completed';

                if (!completion && !isGloballyCompleted) {
                    allCompleted = false;
                    incompleteGoals.push(goal.title);
                }
            }

            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const dashboardUrl = `${baseUrl}/dashboard`;

            // Generate signed delete link
            const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-prod";
            const signature = crypto
                .createHmac("sha256", secret)
                .update(user.id)
                .digest("hex");
            const deleteDirectUrl = `${baseUrl}/api/user/delete-direct?id=${user.id}&sig=${signature}`;

            if (!allCompleted) {
                // Send reminder email ONLY if there are incomplete goals
                await sendEmail(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (user as any).email,
                    'Reminder: You have incomplete goals for today',
                    `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hi ${user.username},</h2>
            <p>You have <strong>${incompleteGoals.length}</strong> incomplete goal(s) for today (${today.toLocaleDateString()}):</p>
            <ul>
              ${incompleteGoals.map(t => `<li><strong>${t}</strong></li>`).join('')}
            </ul>
            <p>There's still time to finish them!</p>
            <p>
              <a href="${dashboardUrl}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Website</a>
            </p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">
              Don't want to proceed with your goals? 
              <br/>
              <a href="${deleteDirectUrl}" style="display: inline-block; background-color: #ff4444; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 10px; font-size: 12px;">Delete Account Immediately</a>
            </p>
          </div>
          `
                );
            }
        }
    } catch (error) {
        console.error('Error in daily goal check:', error);
    }
}
