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
    const goalId = searchParams.get("goalId");
    const noteDate = searchParams.get("noteDate");

    const notes = await prisma.note.findMany({
        where: {
            userId: session.user.id,
            ...(goalId ? { goalId } : {}),
            ...(noteDate ? { noteDate: new Date(noteDate) } : {}),
        },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notes);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, content, goalId, noteDate } = await req.json();

        const note = await prisma.note.create({
            data: {
                title: title || null,
                content,
                userId: session.user.id,
                goalId: goalId || null,
                noteDate: noteDate ? new Date(noteDate) : null,
            },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "Error creating note" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, title, content, goalId, noteDate } = await req.json();

    const note = await prisma.note.update({
        where: { id },
        data: {
            title: title !== undefined ? title : undefined,
            content: content !== undefined ? content : undefined,
            goalId: goalId !== undefined ? goalId : undefined,
            noteDate: noteDate !== undefined ? (noteDate ? new Date(noteDate) : null) : undefined,
        },
    });

    return NextResponse.json(note);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "Missing ID" }, { status: 400 });
    }

    await prisma.note.delete({
        where: { id },
    });

    return NextResponse.json({ message: "Deleted" });
}
