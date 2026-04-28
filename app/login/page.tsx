"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();

    // If already has a session, go attempt connection or dashboard
    useEffect(() => {
        if (status === "authenticated") {
            router.push("/connect-github");
        }
    }, [status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid credentials");
            setLoading(false);
        } else {
            // Success -> go to connect github
            router.push("/connect-github");
        }
    };

    if (status === "loading") return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4 text-white">
            <div className="w-full max-w-md p-10 bg-gray-900/50 border border-gray-800 rounded-[40px] backdrop-blur-2xl shadow-2xl space-y-8">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">Internal <span className="text-blue-500 not-italic">Login</span></h1>
                    <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Authorized Personnel Only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-500 transition-all outline-none"
                            placeholder="admin"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-500 transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "System Entry"}
                    </button>
                </form>

                <div className="pt-8 border-t border-gray-800">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Secondary Auth Stage: GitHub Connection Required Post-Login</p>
                </div>
            </div>
        </div>
    );
}
