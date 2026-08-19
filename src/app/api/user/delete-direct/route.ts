import { NextResponse } from "next/server";

// Kept as a tombstone so old email links cannot perform a destructive GET request.
export async function GET() {
    return NextResponse.json(
        { message: "Direct account deletion links are no longer supported. Sign in and use Settings." },
        { status: 410 },
    );
}
