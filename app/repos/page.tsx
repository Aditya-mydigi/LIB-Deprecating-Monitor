"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { GitHubRepo } from "@/lib/github";
import { RepoList } from "@/components/RepoList";
import { useRouter } from "next/navigation";

export default function ReposPage() {
    const { data: session, status } = useSession();
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [monitoredFullNames, setMonitoredFullNames] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        // Enforce GitHub connection: must be logged in AND have an accessToken
        if (status === "authenticated" && !(session as any)?.accessToken) {
            router.push("/connect-github");
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch GitHub repos
                const githubRes = await fetch("/api/github/repos");
                const githubData = await githubRes.json();
                if (!githubRes.ok) throw new Error(githubData.error || "Failed to fetch GitHub repos");
                setRepos(githubData.repos);

                // Fetch monitored repos from Prisma
                const dbRes = await fetch("/api/repos");
                const dbData = await dbRes.json();
                if (dbRes.ok) {
                    const activeFullNames = dbData.repos
                        .filter((r: any) => r.isActive)
                        .map((r: any) => r.full_name);
                    setMonitoredFullNames(new Set(activeFullNames));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (status === "authenticated") {
            fetchData();
        }
    }, [status, session, router]);

    const handleToggleRepo = (repo: GitHubRepo) => {
        const next = new Set(monitoredFullNames);
        if (next.has(repo.full_name)) {
            next.delete(repo.full_name);
        } else {
            next.add(repo.full_name);
        }
        setMonitoredFullNames(next);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const syncData = repos.map(r => ({
                name: r.name,
                full_name: r.full_name,
                isActive: monitoredFullNames.has(r.full_name)
            }));

            const res = await fetch("/api/repos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repos: syncData })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save monitored repos");
            }

            router.push("/dashboard");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading") return null;

    return (
        <div className="min-h-screen bg-[#030712] text-white">
            <Navbar />
            <main className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Monitored <span className="text-blue-500 not-italic">Repositories</span></h1>
                        <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase mt-2">Source: GitHub REST API // Target: Local Persistence</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest text-xs active:scale-95"
                    >
                        {saving ? "Synchronizing..." : "Save Selection"}
                    </button>
                </header>

                <div className="bg-gray-900/10 border border-gray-800 rounded-[48px] p-10 backdrop-blur-xl">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-gray-800/50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-20 text-center text-red-500 font-bold uppercase tracking-widest">{error}</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {repos.map(repo => {
                                const isActive = monitoredFullNames.has(repo.full_name);
                                return (
                                    <div 
                                        key={repo.id}
                                        onClick={() => handleToggleRepo(repo)}
                                        className={`flex items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer ${
                                            isActive 
                                            ? "bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/5" 
                                            : "bg-gray-900/30 border-gray-800 hover:border-gray-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                isActive ? "bg-blue-500 border-blue-500" : "border-gray-700"
                                            }`}>
                                                {isActive && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className={`font-black text-sm tracking-tight ${isActive ? "text-blue-400" : "text-gray-200"}`}>{repo.full_name}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Default Branch: {repo.default_branch}</p>
                                            </div>
                                        </div>
                                        {repo.private && (
                                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">Private</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
