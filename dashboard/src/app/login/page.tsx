"use client";

import { createClient } from "@/utils/supabase/client";
import { Github, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMsg(error.message);
            setLoading(false);
        } else {
            // Redirect handled by middleware/client logic
            window.location.href = "/";
        }
    };

    const handleGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-8 z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                        <Lock className="text-zinc-100" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Welcome Back</h1>
                    <p className="text-zinc-400 text-sm mt-2">Sign in to manage your knowledge base</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogle}
                        className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-200 text-sm rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent block p-2.5 placeholder-zinc-600 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-zinc-800 text-zinc-200 text-sm rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent block p-2.5 placeholder-zinc-600 outline-none transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? "Signing in..." : (
                                <>
                                    <Mail size={18} />
                                    Sign in via Email
                                </>
                            )}
                        </button>
                        {msg && <p className="text-red-400 text-xs text-center">{msg}</p>}
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
