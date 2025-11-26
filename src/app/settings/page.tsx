"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch("/api/user/delete", {
                method: "DELETE",
            });

            if (res.ok) {
                await signOut({ redirect: false });
                router.push("/login");
            } else {
                alert("Failed to delete account");
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("An error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">
                        Back to Dashboard
                    </Link>
                </div>

                <div className="border-t pt-6">
                    <h2 className="mb-4 text-xl font-semibold text-red-600">Danger Zone</h2>
                    <p className="mb-4 text-gray-600">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="rounded-lg bg-red-600 px-6 py-2 font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                        {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}
