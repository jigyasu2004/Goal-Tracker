"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200">
            <div className="container mx-auto flex items-center justify-between px-4 lg:px-6 py-3">
                <Link href="/dashboard" className="flex items-center space-x-2 lg:space-x-3">
                    <Image
                        src="/logo.svg"
                        alt="Goal Tracker Logo"
                        width={32}
                        height={32}
                        className="drop-shadow-md lg:w-10 lg:h-10"
                    />
                    <span className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Goal Tracker
                    </span>
                </Link>
                <div className="flex items-center space-x-2 lg:space-x-4">
                    <div className="flex items-center space-x-2 lg:space-x-3 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 px-2 lg:px-5 py-1 lg:py-2 border border-purple-100">
                        <div className="flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-xs lg:text-sm">
                            {session?.user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden lg:inline font-semibold text-gray-700">
                            {session?.user?.name}
                        </span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="rounded-lg bg-gradient-to-r from-red-500 to-pink-600 px-3 lg:px-5 py-1.5 lg:py-2 text-xs lg:text-sm font-bold text-white transition hover:from-red-600 hover:to-pink-700 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>
    );
}
