import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function dateOnly(value: unknown): Date | null {
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function ownsGoal(goalId: string | null | undefined, userId: string) {
    if (!goalId) return true;
    return Boolean(await prisma.goal.findFirst({ where: { id: goalId, userId }, select: { id: true } }));
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const searchParams = new URL(req.url).searchParams;
    const goalId = searchParams.get("goalId");
    const noteDateValue = searchParams.get("noteDate");
    const noteDate = noteDateValue ? dateOnly(noteDateValue) : null;

    const notes = await prisma.note.findMany({
        where: { userId: session.user.id, ...(goalId ? { goalId } : {}), ...(noteDate ? { noteDate } : {}) },
        orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(notes);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { title, content, goalId, noteDate } = await req.json();
        if (typeof content !== "string" || !content.trim()) return NextResponse.json({ message: "Reflection cannot be empty." }, { status: 400 });
        if (!(await ownsGoal(goalId, session.user.id))) return NextResponse.json({ message: "Goal not found." }, { status: 404 });

        const note = await prisma.note.create({
            data: {
                title: typeof title === "string" && title.trim() ? title.trim().slice(0, 120) : null,
                content: content.trim().slice(0, 10000),
                userId: session.user.id,
                goalId: goalId || null,
                noteDate: dateOnly(noteDate),
            },
        });
        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "Error creating note" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    try {
        const { id, title, content, goalId, noteDate } = await req.json();
        if (typeof id !== "string") return NextResponse.json({ message: "Missing ID" }, { status: 400 });
        if (goalId !== undefined && !(await ownsGoal(goalId, session.user.id))) return NextResponse.json({ message: "Goal not found." }, { status: 404 });

        const result = await prisma.note.updateMany({
            where: { id, userId: session.user.id },
            data: {
                title: title !== undefined ? (typeof title === "string" && title.trim() ? title.trim().slice(0, 120) : null) : undefined,
                content: typeof content === "string" ? content.trim().slice(0, 10000) : undefined,
                goalId: goalId !== undefined ? goalId || null : undefined,
                noteDate: noteDate !== undefined ? dateOnly(noteDate) : undefined,
            },
        });
        if (result.count === 0) return NextResponse.json({ message: "Note not found." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating note:", error);
        return NextResponse.json({ error: "Error updating note" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

    const result = await prisma.note.deleteMany({ where: { id, userId: session.user.id } });
    if (result.count === 0) return NextResponse.json({ message: "Note not found." }, { status: 404 });
    return NextResponse.json({ message: "Deleted" });
}
