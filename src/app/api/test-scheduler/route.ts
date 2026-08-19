import { NextResponse } from "next/server";
import { checkGoalsAndNotify } from "@/lib/scheduler";

export async function POST(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    try {
        await checkGoalsAndNotify();
        return NextResponse.json({ message: "Scheduler check completed." });
    } catch (error) {
        console.error("Error triggering scheduler:", error);
        return NextResponse.json({ error: "Failed to check" }, { status: 500 });
    }
}
