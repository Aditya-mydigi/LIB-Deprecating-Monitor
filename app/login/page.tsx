"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
            router.push("/dashboard");
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
            // Success -> go to dashboard
            router.push("/dashboard");
        }
    };

    if (status === "loading") return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 text-slate-900">
            <div className="w-full max-w-md p-12 bg-white border border-slate-200/60 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16"></div>
                
                <div className="flex justify-center -mb-4">
                    <Image 
                        src="/mdrLogo.png" 
                        alt="MDR Logo" 
                        width={200} 
                        height={60} 
                        className="object-contain"
                        priority
                    />
                </div>
                
                <div className="text-center space-y-4 relative z-10">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-8 transform hover:scale-105 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Security <span className="text-indigo-600 not-italic">Portal</span></h1>
                    <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">Verification Protocol Required</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Credential Identifier</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none placeholder:text-slate-300"
                            placeholder="username"
                            required
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Access Key</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-sm font-bold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none placeholder:text-slate-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    
                    <div className="flex items-center justify-end">
                        <button type="button" className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-700 transition-colors">Forgot Password?</button>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-shake">
                            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Decrypting..." : "Initiate Access"}
                    </button>
                </form>

                <div className="pt-10 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center italic leading-loose">Automated Monitoring System v4.0<br/>Secondary Auth Phase: GitHub Handshake Required</p>
                </div>
            </div>
        </div>
    );
}
