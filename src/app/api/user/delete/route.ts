import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.user.delete({
            where: {
                id: session.user.id,
            },
        });

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ message: "Failed to delete account" }, { status: 500 });
    }
}
