import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const username = typeof body.username === "string" ? body.username.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const timezone = typeof body.timezone === "string" && isValidTimezone(body.timezone) ? body.timezone : "UTC";

        if (!USERNAME_PATTERN.test(username)) return NextResponse.json({ message: "Username must be 3–30 characters and use only letters, numbers, _ or -." }, { status: 400 });
        if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
        if (password.length < 8 || password.length > 128) return NextResponse.json({ message: "Password must be between 8 and 128 characters." }, { status: 400 });

        const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
        if (existingUser) return NextResponse.json({ message: "That username or email is already in use." }, { status: 409 });

        const user = await prisma.user.create({ data: { username, email, password: await hash(password, 12), timezone } });

        // Never send passwords by email. A welcome email contains only a sign-in link.
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            try {
                const { sendEmail } = await import("@/lib/email");
                const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
                await sendEmail(email, "Welcome to Northstar", `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243b2b"><h2>Welcome, ${escapeHtml(username)}.</h2><p>Your account is ready. Start with one small action you can honestly complete today.</p><p><a href="${loginUrl}" style="display:inline-block;background:#285d3c;color:white;padding:11px 18px;text-decoration:none;border-radius:9px">Plan your first day</a></p></div>`);
            } catch (emailError) {
                console.error("Welcome email failed:", emailError);
            }
        }

        return NextResponse.json({ message: "User created successfully", user: { id: user.id, username: user.username } }, { status: 201 });
    } catch (error) {
        console.error("Registration failed:", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}

function isValidTimezone(value: string) {
    try { Intl.DateTimeFormat(undefined, { timeZone: value }); return true; } catch { return false; }
}

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}
