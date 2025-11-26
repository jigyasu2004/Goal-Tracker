import cron from 'node-cron';
import { prisma } from './prisma';
import { sendEmail } from './email';
import crypto from 'crypto';

export function initScheduler() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('Running hourly goal check...');
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

        const now = new Date();

        for (const user of users) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(user as any).email) continue;

            // Check user's local time
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userTimezone = (user as any).timezone || 'UTC';

            // Get current hour in user's timezone
            const userDateString = now.toLocaleString('en-US', { timeZone: userTimezone });
            const userDate = new Date(userDateString);
            const userHour = userDate.getHours();

            // Only proceed if it's 10 PM (22:00) in user's local time
            if (userHour !== 22) continue;

            console.log(`Checking goals for user ${user.username} at 10 PM ${userTimezone}`);

            // Find goals active today (using user's local date)
            const goalsForToday = user.goals.filter(goal => {
                if (goal.status === 'archived') return false;

                // Check if targetDate matches today (in user's timezone)
                if (goal.targetDate) {
                    const target = new Date(goal.targetDate);
                    return target.getDate() === userDate.getDate() &&
                        target.getMonth() === userDate.getMonth() &&
                        target.getFullYear() === userDate.getFullYear();
                }

                // Check recurring days
                if (goal.recurringDays) {
                    try {
                        const days = JSON.parse(goal.recurringDays);
                        const dayName = userDate.toLocaleDateString('en-US', { weekday: 'long' });
                        return days.includes(dayName);
                    } catch {
                        return false;
                    }
                }

                return true;
            });

            if (goalsForToday.length === 0) continue;

            let allCompleted = true;
            const incompleteGoals: string[] = [];

            for (const goal of goalsForToday) {
                // Check if completed today via GoalCompletion
                // We fetch all completions and filter in JS to avoid complex timezone DB queries
                const completions = await prisma.goalCompletion.findMany({
                    where: {
                        goalId: goal.id,
                        completed: true,
                    }
                });

                const isCompletedToday = completions.some(c => {
                    // Convert completion date to user's timezone to check if it matches "today"
                    const cDate = new Date(c.date);
                    const cDateInUserTz = cDate.toLocaleString('en-US', { timeZone: userTimezone });
                    const cUserDate = new Date(cDateInUserTz);
                    return cUserDate.getDate() === userDate.getDate() &&
                        cUserDate.getMonth() === userDate.getMonth() &&
                        cUserDate.getFullYear() === userDate.getFullYear();
                });

                const isGloballyCompleted = goal.status === 'completed';

                if (!isCompletedToday && !isGloballyCompleted) {
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
                // Send reminder email
                await sendEmail(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (user as any).email,
                    'Reminder: You have incomplete goals for today',
                    `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hi ${user.username},</h2>
            <p>It's 10 PM! You have <strong>${incompleteGoals.length}</strong> incomplete goal(s) for today (${userDate.toLocaleDateString()}):</p>
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
        console.error('Error in hourly goal check:', error);
    }
}
