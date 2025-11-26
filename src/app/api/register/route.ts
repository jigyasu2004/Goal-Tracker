import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { username, email, password } = await req.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { message: "Username, email, and password are required" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: "User with this username or email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        // Send welcome email
        try {
            const { sendEmail } = await import("@/lib/email");
            await sendEmail(
                email,
                "Welcome to Goal Tracker!",
                `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome, ${username}!</h2>
                    <p>Your account has been successfully created.</p>
                    <p><strong>Username:</strong> ${username}</p>
                    <p><strong>Password:</strong> ${password}</p>
                    <p>We recommend you keep this information safe.</p>
                    <p>
                        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a>
                    </p>
                </div>
                `
            );
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // We don't want to fail the registration if email fails, just log it
        }

        return NextResponse.json(
            { message: "User created successfully", user: { id: user.id, username: user.username } },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}
