"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GitHubRepo } from "@/lib/github";
import Image from "next/image";

export default function OnboardingPage() {
    const { data: session, status } = useSession();
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [selectedFullNames, setSelectedFullNames] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        const fetchData = async () => {
            try {
                const githubRes = await fetch("/api/github/repos");
                const githubData = await githubRes.json();
                if (!githubRes.ok) throw new Error(githubData.error || "Failed to fetch GitHub repos");
                setRepos(githubData.repos);

                // Pre-select already active repos if any exist
                const dbRes = await fetch("/api/repos");
                const dbData = await dbRes.json();
                if (dbRes.ok && dbData.repos.length > 0) {
                    const activeFullNames = dbData.repos
                        .filter((r: any) => r.isActive)
                        .map((r: any) => r.fullName);
                    setSelectedFullNames(new Set(activeFullNames));
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
    }, [status, router]);

    const toggleRepo = (fullName: string) => {
        const next = new Set(selectedFullNames);
        if (next.has(fullName)) {
            next.delete(fullName);
        } else {
            next.add(fullName);
        }
        setSelectedFullNames(next);
    };

    const handleFinish = async () => {
        if (selectedFullNames.size === 0) {
            alert("Please select at least one repository to continue.");
            return;
        }

        setSaving(true);
        try {
            const syncData = repos.map(r => ({
                name: r.name,
                full_name: r.full_name,
                isActive: selectedFullNames.has(r.full_name)
            }));

            const res = await fetch("/api/repos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repos: syncData })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save selection");
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
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center p-8 lg:p-16">
            <div className="w-full max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <header className="text-center space-y-6">
                    <div className="flex justify-center mb-8">
                        <Image src="/mdrLogo.png" alt="MDR Logo" width={180} height={50} className="object-contain" priority />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-slate-900 leading-tight">
                            Personalize Your <span className="text-indigo-600 not-italic">Watchlist</span>
                        </h1>
                        <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">Select Target Repositories for Active Monitoring</p>
                    </div>
                    <div className="h-1 w-24 bg-indigo-600 mx-auto rounded-full mt-8" />
                </header>

                {error ? (
                    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[40px] text-center max-w-lg mx-auto space-y-4">
                        <p className="text-rose-500 font-black uppercase text-xs tracking-widest">{error}</p>
                        <button onClick={() => window.location.reload()} className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Retry Protocol</button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-4 animate-pulse">
                                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                                        <div className="h-3 bg-slate-50 rounded w-1/2" />
                                    </div>
                                ))
                            ) : repos.length > 0 ? (
                                repos.map((repo) => {
                                    const isSelected = selectedFullNames.has(repo.full_name);
                                    return (
                                        <div 
                                            key={repo.id}
                                            onClick={() => toggleRepo(repo.full_name)}
                                            className={`group relative bg-white p-8 rounded-[40px] border-2 transition-all duration-300 cursor-pointer ${
                                                isSelected 
                                                ? "border-indigo-600 shadow-2xl shadow-indigo-100 -translate-y-1" 
                                                : "border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-100"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                                    isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-200 group-hover:border-indigo-300"
                                                }`}>
                                                    {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                {repo.language && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        {repo.language}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-black text-lg tracking-tight truncate text-slate-900 group-hover:text-indigo-600 transition-colors">{repo.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{repo.owner}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-tighter animate-in zoom-in-50">
                                                    Monitored
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="col-span-full py-20 text-center space-y-4">
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Repositories Found in this Profile</p>
                                </div>
                            )}
                        </div>

                        {!loading && repos.length > 0 && (
                            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
                                <button
                                    onClick={handleFinish}
                                    disabled={saving || selectedFullNames.size === 0}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[32px] transition-all shadow-2xl shadow-slate-300 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Deploy Watchlist ({selectedFullNames.size})
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
