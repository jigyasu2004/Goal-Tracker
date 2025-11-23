import Link from "next/link";
import Image from "next/image";

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
            <div className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
                    {/* Left side - Text content */}
                    <div className="text-white space-y-6">
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                            Achieve Your <span className="text-yellow-300">Goals</span> with Ease
                        </h1>
                        <p className="text-xl md:text-2xl text-purple-100">
                            Track daily, short-term, and long-term goals with our intuitive calendar interface. Stay organized and motivated!
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Link
                                href="/register"
                                className="px-8 py-4 bg-white text-purple-600 rounded-full text-lg font-bold hover:bg-yellow-300 hover:text-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href="/login"
                                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full text-lg font-bold hover:bg-white hover:text-purple-600 transition-all duration-300"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 pt-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-300">📅</div>
                                <p className="text-sm mt-2">Calendar View</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-300">📝</div>
                                <p className="text-sm mt-2">Smart Notes</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-yellow-300">🎯</div>
                                <p className="text-sm mt-2">Track Progress</p>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Hero image */}
                    <div className="relative">
                        <div className="relative z-10">
                            <Image
                                src="/hero.svg"
                                alt="Goal Tracking Illustration"
                                width={600}
                                height={600}
                                className="w-full h-auto drop-shadow-2xl"
                                priority
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -right-4 w-72 h-72 bg-yellow-300 rounded-full opacity-20 blur-3xl"></div>
                        <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
                    </div>
                </div>
            </div>
        </main>
    );
}
