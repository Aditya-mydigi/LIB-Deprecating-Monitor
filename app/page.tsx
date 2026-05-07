"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if they have any active repos
      fetch("/api/repos")
        .then(res => res.json())
        .then(data => {
            if (data.repos?.length > 0) {
                router.push("/dashboard");
            } else {
                router.push("/onboarding");
            }
        })
        .catch(() => router.push("/dashboard"));
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Initializing System...</p>
        </div>
    </div>
  );
}
