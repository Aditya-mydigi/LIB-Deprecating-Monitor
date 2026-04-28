"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// --- Types ---
interface EnhancedDependency {
    name: string;
    currentVersion: string;
    latestVersion: string;
    updateType: "up-to-date" | "patch" | "minor" | "major" | "unknown";
    impact: string;
    npmCommand: string;
    releasesUrl: string | null;
    isDev: boolean;
}

type UpdateFilter = "all" | "major" | "minor" | "patch" | "up-to-date";

// --- Components ---

function StatCard({ label, value, color, description }: { label: string, value: string | number, color: string, description?: string }) {
    return (
        <div className="flex-1 min-w-[200px] p-8 rounded-[32px] border border-gray-800 bg-gray-950 shadow-xl transition-all hover:border-gray-700">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
            <div className="flex items-baseline gap-3 mt-3">
                <p className={`text-4xl font-black tracking-tighter ${color}`}>{value}</p>
                {description && <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{description}</span>}
            </div>
        </div>
    );
}

function UpdateTypeBadge({ type }: { type: EnhancedDependency["updateType"] }) {
    const configs = {
        "up-to-date": { label: "Safe", styles: "text-green-400 bg-green-500/10 border-green-500/20" },
        "patch": { label: "Update", styles: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        "minor": { label: "Minor", styles: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
        "major": { label: "Critical", styles: "text-red-400 bg-red-500/10 border-red-500/20" },
        "unknown": { label: "Verify", styles: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
    };
    const config = configs[type];
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${config.styles}`}>{config.label}</span>;
}

function DependencyTable({ deps, title, loading, filter }: { deps: EnhancedDependency[], title: string, loading: boolean, filter: UpdateFilter }) {
    const filteredDeps = useMemo(() => {
        if (filter === "all") return deps;
        if (filter === "minor") return deps.filter(d => d.updateType === "minor" || d.updateType === "patch");
        return deps.filter(d => d.updateType === filter);
    }, [deps, filter]);

    if (!loading && deps.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-lg text-white uppercase tracking-tight">{title} <span className="text-gray-500 font-bold ml-1">Inventory</span></h3>
                <span className="text-[10px] font-black text-gray-400 bg-gray-900 px-4 py-1.5 rounded-full border border-gray-800">{filteredDeps.length} LIBRARIES</span>
            </div>
            
            <div className="relative overflow-hidden rounded-[32px] border border-gray-800 bg-gray-950 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                        <thead className="bg-gray-900/50 backdrop-blur border-b border-gray-800">
                            <tr>
                                <th className="px-8 py-6 font-black text-gray-500 uppercase text-[9px] tracking-widest">Library Name</th>
                                <th className="px-8 py-6 font-black text-gray-500 uppercase text-[9px] tracking-widest">Installed</th>
                                <th className="px-8 py-6 font-black text-gray-500 uppercase text-[9px] tracking-widest">Latest</th>
                                <th className="px-8 py-6 font-black text-gray-500 uppercase text-[9px] tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={4} className="px-8 py-10 animate-pulse text-gray-600 font-black uppercase text-[10px] tracking-widest text-center">Rebuilding Dependency Matrix...</td></tr>
                            ) : (
                                filteredDeps.map((dep) => (
                                    <tr key={dep.name} className="group hover:bg-gray-900/40 transition-all text-xs">
                                        <td className="px-8 py-6 font-black text-blue-400 font-mono">{dep.name}</td>
                                        <td className="px-8 py-6 text-gray-500 font-mono font-bold">{dep.currentVersion}</td>
                                        <td className="px-8 py-6 text-white font-black font-mono">{dep.latestVersion}</td>
                                        <td className="px-8 py-6"><UpdateTypeBadge type={dep.updateType} /></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---

export default function Dashboard() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeRepo = searchParams.get("repo");

    const [repos, setRepos] = useState<any[]>([]);
    const [reposLoading, setReposLoading] = useState(true);
    
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [dependencies, setDependencies] = useState<EnhancedDependency[]>([]);
    const [devDependencies, setDevDependencies] = useState<EnhancedDependency[]>([]);
    const [filter, setFilter] = useState<UpdateFilter>("all");

    // 1. Initial Access & Repo List Fetch
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            if (!(session as any)?.accessToken) {
                router.push("/connect-github");
                return;
            }

            const fetchRepos = async () => {
                try {
                    const res = await fetch("/api/github/repos");
                    const data = await res.json();
                    setRepos(data.repos || []);
                    
                    // Auto-select first repo if none active
                    if (data.repos?.length > 0 && !activeRepo) {
                        router.replace(`/dashboard?repo=${data.repos[0].full_name}`);
                    }
                } catch (err) {
                    console.error("Failed to fetch repositories:", err);
                } finally {
                    setReposLoading(false);
                }
            };
            fetchRepos();
        }
    }, [status, session, router, activeRepo]);

    // 2. Fetch Analysis for Active Repo
    useEffect(() => {
        if (activeRepo && status === "authenticated") {
            const fetchAnalysis = async () => {
                setAnalysisLoading(true);
                try {
                    const [owner, repoName] = activeRepo.split("/");
                    const res = await fetch(`/api/github/dependencies?owner=${owner}&repo=${repoName}`);
                    const data = await res.json();
                    setDependencies(data.dependencies || []);
                    setDevDependencies(data.devDependencies || []);
                } catch (err) {
                    console.error("Analysis failed:", err);
                } finally {
                    setAnalysisLoading(false);
                }
            };
            fetchAnalysis();
        }
    }, [activeRepo, status]);

    const stats = useMemo(() => {
        const all = [...dependencies, ...devDependencies];
        return {
            total: all.length,
            major: all.filter(d => d.updateType === "major").length,
            safe: all.filter(d => d.updateType === "up-to-date").length,
            health: all.length > 0 ? Math.round((all.filter(d => d.updateType === "up-to-date").length / all.length) * 100) : 0
        };
    }, [dependencies, devDependencies]);

    if (status === "loading" || (status === "authenticated" && reposLoading)) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center">
                 <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Synchronizing Telemetry...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="p-8 max-w-[1500px] mx-auto space-y-12 animate-in fade-in duration-700">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-gray-800">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                             <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Developer <span className="text-blue-500 not-italic">Dashboard</span></h1>
                            <p className="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase">Automated Dependency Orchestration</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <select 
                            value={activeRepo || ""}
                            onChange={(e) => router.push(`/dashboard?repo=${e.target.value}`)}
                            className="bg-gray-900/50 border border-gray-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl px-8 py-4 outline-none appearance-none hover:border-blue-500/50 cursor-pointer transition-all w-full md:w-[400px]"
                        >
                            {repos.map(r => (
                                <option key={r.id} value={r.full_name}>{r.full_name}</option>
                            ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover:text-blue-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                <div className="flex bg-gray-950 p-1.5 rounded-2xl border border-gray-800">
                    {(["all", "major", "minor", "up-to-date"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === t ? "bg-gray-900 border border-gray-800 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"
                            }`}
                        >
                            {t === "up-to-date" ? "Healthy" : t}
                        </button>
                    ))}
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="Connected Repos" value={repos.length} color="text-white" description="GitHub Unit Count" />
                <StatCard label="Active Dependencies" value={stats.total} color="text-blue-500" description="Selected Target" />
                <StatCard label="Critical Actions" value={stats.major} color="text-red-500" description="Major Upgrades" />
                <StatCard label="Health Score" value={`${stats.health}%`} color={stats.health > 70 ? "text-green-500" : stats.health > 40 ? "text-yellow-500" : "text-red-500"} description="Project Integrity" />
            </section>

            <div className="space-y-16">
                 <DependencyTable deps={dependencies} title="Production" loading={analysisLoading} filter={filter} />
                 <DependencyTable deps={devDependencies} title="Development" loading={analysisLoading} filter={filter} />
            </div>
        </main>
    );
}