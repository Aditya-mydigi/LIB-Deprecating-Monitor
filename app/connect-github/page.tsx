"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectGithubPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        // If session exists AND has an accessToken, they are already connected
        if (status === "authenticated" && (session as any).accessToken) {
            router.push("/dashboard");
        }
    }, [status, session, router]);

    const handleConnect = async () => {
        setLoading(true);
        // We trigger GitHub OAuth
        // Note: For account linking in NextAuth 5 without DB, 
        // GitHub might overwrite the credentials identity.
        // This is fine for this internal tool as login was the gatekeeper.
        await signIn("github", { callbackUrl: "/dashboard" });
    };

    if (status === "loading" || (status === "authenticated" && (session as any).accessToken)) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 text-slate-900">
            <div className="w-full max-w-md p-12 bg-white border border-slate-200/60 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] space-y-10 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16"></div>
                
                <div className="text-center space-y-4 relative z-10">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-center mx-auto shadow-sm mb-8 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors animate-pulse" />
                        <svg className="w-10 h-10 text-indigo-600 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Secure <span className="text-indigo-600 not-italic">Handshake</span></h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-loose">Access Token Synchronization Required</p>
                </div>

                <div className="space-y-6 relative z-10">
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                Authenticate GitHub
                            </>
                        )}
                    </button>
                    
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center italic">Authorization grants read-only access to repository metadata</p>
                </div>
            </div>
        </div>
    );
}
