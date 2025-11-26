import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        username: credentials.username,
                    },
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id + "",
                    username: user.username,
                    name: user.username,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.id) {
                // Verify user still exists
                const user = await prisma.user.findUnique({
                    where: { id: token.id as string },
                });

                if (!user) {
                    // User deleted, return null to invalidate session
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return null as any;
                }

                return {
                    ...session,
                    user: {
                        ...session.user,
                        username: token.username,
                        id: token.id,
                    },
                };
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                return {
                    ...token,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    username: (user as any).username,
                    id: user.id,
                };
            }
            return token;
        },
    },
};
