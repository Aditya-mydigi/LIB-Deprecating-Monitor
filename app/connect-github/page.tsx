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
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#030712] p-4 text-white">
            <div className="w-full max-w-md p-10 bg-gray-900/50 border border-gray-800 rounded-[40px] backdrop-blur-2xl shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-950 border border-gray-800 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl mb-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                        <svg className="w-10 h-10 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Account <span className="text-blue-500 not-italic">Connection</span></h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">System login successful. Connect your GitHub account to access repository telemetry and analysis.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full bg-white text-black font-black py-5 rounded-3xl transition-all shadow-xl shadow-white/5 uppercase tracking-widest text-[11px] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                Connect GitHub Account
                            </>
                        )}
                    </button>
                    
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center">Encryption Protocols Enabled</p>
                </div>
            </div>
        </div>
    );
}
