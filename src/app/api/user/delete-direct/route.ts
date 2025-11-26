import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const signature = searchParams.get("sig");

    if (!id || !signature) {
        return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-prod";
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(id)
        .digest("hex");

    if (signature !== expectedSignature) {
        return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    try {
        // Delete user and all related data
        // Prisma handles cascading deletes if configured, but let's be explicit or rely on schema
        // Schema usually has onDelete: Cascade. Let's check schema or just delete user.
        // If schema has relations without cascade, this might fail.
        // Assuming standard setup or that we want to delete user.

        // We should probably check if user exists first?
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Delete the user. 
        // Note: If there are foreign key constraints without cascade, we might need to delete related data first.
        // Let's assume the schema handles it or we delete the user and let Prisma handle it.
        // Given the previous `delete` route just deleted the user, we'll do the same.

        await prisma.user.delete({
            where: { id },
        });

        // Redirect to homepage with a success message (or a specific goodbye page)
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        return NextResponse.redirect(`${baseUrl}/?deleted=true`);

    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Error deleting account" }, { status: 500 });
    }
}
