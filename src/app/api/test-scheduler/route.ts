import { NextResponse } from "next/server";
import { checkGoalsAndNotify } from "@/lib/scheduler";

// This is a temporary route for testing purposes
export async function GET() {
    try {
        console.log("Manually triggering daily goal check...");
        await checkGoalsAndNotify();
        return NextResponse.json({ message: "Scheduler check triggered successfully. Check server logs and email." });
    } catch (error) {
        console.error("Error triggering scheduler:", error);
        return NextResponse.json({ error: "Failed to check" }, { status: 500 });
    }
}
