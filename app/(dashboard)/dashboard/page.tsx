"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    PieChart,
    Pie,
    Cell
} from "recharts";

// --- Types ---
interface EnhancedDependency {
    name: string;
    currentVersion: string;
    latestVersion: string;
    updateType: "up-to-date" | "patch" | "minor" | "major" | "vulnerable" | "unknown";
    impact: string;
    npmCommand: string;
    releasesUrl: string | null;
    isDev: boolean;
}

type UpdateFilter = "all" | "vulnerable" | "major" | "minor" | "patch" | "up-to-date";

// --- Components ---

function StatCard({ label, value, color, icon, description, trend, href }: { 
    label: string, 
    value: string | number, 
    color: string, 
    icon: React.ReactNode,
    description?: string, 
    trend?: string,
    href?: string 
}) {
    const content = (
        <div className={`group p-8 rounded-[32px] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}></div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors`}>
                        {icon}
                    </div>
                    {trend && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-50 text-green-600 border border-green-100">
                            {trend}
                        </span>
                    )}
                </div>
                
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black tracking-tighter text-slate-900">{value}</p>
                    {description && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{description}</span>}
                </div>
            </div>
        </div>
    );

    if (href) return <Link href={href}>{content}</Link>;
    return content;
}

function UpdateTypeBadge({ type }: { type: EnhancedDependency["updateType"] }) {
    const configs = {
        "up-to-date": { label: "Optimized", styles: "text-green-600 bg-green-50 border-green-100" },
        "patch": { label: "Patch Upd", styles: "text-blue-600 bg-blue-50 border-blue-100" },
        "minor": { label: "Minor Upd", styles: "text-amber-600 bg-amber-50 border-amber-100" },
        "major": { label: "Major Update", styles: "text-orange-600 bg-orange-50 border-orange-100" },
        "vulnerable": { label: "Critical", styles: "text-rose-600 bg-rose-50 border-rose-100 animate-pulse" },
        "unknown": { label: "Verify", styles: "text-slate-500 bg-slate-50 border-slate-100" },
    };
    const config = configs[type];
    return <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border tracking-wider ${config.styles}`}>{config.label}</span>;
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
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div>
                    <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight italic">{title} <span className="text-slate-400 not-italic ml-1">Libraries</span></h3>
                </div>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                    {filteredDeps.length} UNITS DETECTED
                </span>
            </div>
            
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 font-bold text-slate-400 uppercase text-[9px] tracking-[0.2em]">Package Identifier</th>
                                <th className="px-8 py-6 font-bold text-slate-400 uppercase text-[9px] tracking-[0.2em]">Active Ver.</th>
                                <th className="px-8 py-6 font-bold text-slate-400 uppercase text-[9px] tracking-[0.2em]">Latest Signal</th>
                                <th className="px-8 py-6 font-bold text-slate-400 uppercase text-[9px] tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-8 py-4 h-16 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : (
                                filteredDeps.map((dep) => (
                                    <tr key={dep.name} className="group hover:bg-slate-50/50 transition-all duration-200">
                                        <td className="px-8 py-5">
                                            <span className="font-bold text-indigo-600 font-mono text-[13px] group-hover:text-slate-900 transition-colors">{dep.name}</span>
                                        </td>
                                        <td className="px-8 py-5 text-slate-400 font-mono text-[12px]">{dep.currentVersion}</td>
                                        <td className="px-8 py-5 text-slate-900 font-bold font-mono text-[12px]">{dep.latestVersion}</td>
                                        <td className="px-8 py-5"><UpdateTypeBadge type={dep.updateType} /></td>
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
    const [error, setError] = useState<string | null>(null);
    const [revalidating, setRevalidating] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            // Check for accessToken removed to allow manual connection via Repository module

            const fetchRepos = async () => {
                try {
                    const res = await fetch("/api/repos");
                    const data = await res.json();
                    // Filter to only active repos from our database
                    const activeRepos = (data.repos || []).filter((r: any) => r.isActive);
                    setRepos(activeRepos);
                    
                    if (activeRepos.length > 0 && !activeRepo) {
                        router.replace(`/dashboard?repo=${activeRepos[0].fullName}`);
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

    useEffect(() => {
        if (activeRepo && status === "authenticated") {
            const fetchAnalysis = async (forceRefresh = false) => {
                if (forceRefresh) {
                    setRevalidating(true);
                } else {
                    setAnalysisLoading(true);
                }

                try {
                    setError(null);
                    const [owner, repoName] = activeRepo.split("/");
                    
                    let url = `/api/github/dependencies?owner=${owner}&repo=${repoName}${forceRefresh ? "&refresh=true" : ""}`;
                    if (owner === "manual") {
                        url = `/api/manual/dependencies?repo=${repoName}${forceRefresh ? "&refresh=true" : ""}`;
                    }
                    
                    const res = await fetch(url);
                    const data = await res.json();
                    
                    if (!res.ok) {
                        setError(data.error || "Failed to fetch dependencies");
                        setDependencies([]);
                        setDevDependencies([]);
                    } else {
                        setDependencies(data.dependencies || []);
                        setDevDependencies(data.devDependencies || []);

                        // If this was a cache hit, trigger a background refresh
                        if (data.fromCache && !forceRefresh) {
                            console.log("Cache hit, triggering background re-validation...");
                            fetchAnalysis(true);
                        }
                    }
                } catch (err) {
                    setError("Failed to establish neural link with repository");
                    console.error("Analysis failed:", err);
                } finally {
                    setAnalysisLoading(false);
                    setRevalidating(false);
                }
            };
            fetchAnalysis();
        }
    }, [activeRepo, status]);

    const stats = useMemo(() => {
        const all = [...dependencies, ...devDependencies];
        const safe = all.filter(d => d.updateType === "up-to-date").length;
        const vulnerable = all.filter(d => d.updateType === "vulnerable").length;
        const major = all.filter(d => d.updateType === "major").length;
        const minor = all.filter(d => d.updateType === "minor").length;
        return {
            total: all.length,
            outdated: all.length - safe,
            safe: safe,
            vulnerable,
            major,
            minor,
            health: all.length > 0 ? Math.round((safe / all.length) * 100) : 0
        };
    }, [dependencies, devDependencies]);

    const chartData = [
        { name: 'Healthy', value: stats.safe, color: '#6366f1' },
        { name: 'Minor', value: stats.minor, color: '#f59e0b' },
        { name: 'Major', value: stats.major, color: '#f97316' },
        { name: 'Critical', value: stats.vulnerable, color: '#f43f5e' },
    ].filter(d => d.value > 0);

    if (status === "loading" || (status === "authenticated" && reposLoading)) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] animate-slide-up">
            {/* Top Enhanced Header Banner */}
            <div className="bg-gradient-to-b from-indigo-50/50 to-transparent border-b border-indigo-100/20">
                <div className="p-8 pb-12 max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">Active <span className="text-indigo-600 not-italic">Intelligence</span></h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">Real-time dependency telemetry and risk assessment</p>
                                        {revalidating && (
                                            <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 animate-pulse">
                                                <div className="w-1 h-1 bg-indigo-600 rounded-full"></div>
                                                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Syncing Live Data...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="relative group max-w-sm">
                                <select 
                                    value={activeRepo || ""}
                                    onChange={(e) => router.push(`/dashboard?repo=${e.target.value}`)}
                                    className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-widest rounded-xl px-12 py-4 outline-none appearance-none hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-all w-full shadow-sm"
                                >
                                    {repos.map(r => (
                                        <option key={r.id} value={r.fullName}>{r.fullName}</option>
                                    ))}
                                </select>
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-white p-1 rounded-2xl border border-slate-200/60 shadow-sm self-end overflow-x-auto">
                            {(["all", "vulnerable", "major", "minor", "up-to-date"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        filter === t 
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                        : "text-slate-400 hover:text-slate-600"
                                    }`}
                                >
                                    {t === "up-to-date" ? "Healthy" : t === "vulnerable" ? "Critical" : t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 pt-0 space-y-12 max-w-[1400px] mx-auto -mt-6">

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 space-y-8">
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard 
                            label="Connected Repos" 
                            value={repos.length} 
                            color="bg-indigo-500" 
                            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                            description="Source Systems" 
                            href="/repositories"
                        />
                        <div onClick={() => setFilter("all")} className="cursor-pointer">
                            <StatCard 
                                label="Total Dependencies" 
                                value={stats.total} 
                                color="bg-slate-600" 
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                                description="Active Packages" 
                            />
                        </div>
                        <div onClick={() => setFilter("vulnerable")} className="cursor-pointer">
                            <StatCard 
                                label="Security Alerts" 
                                value={stats.vulnerable} 
                                color="bg-rose-500" 
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                description="Critical Threats" 
                            />
                        </div>
                        <div onClick={() => setFilter("up-to-date")} className="cursor-pointer">
                            <StatCard 
                                label="Up-to-Date" 
                                value={stats.safe} 
                                color="bg-emerald-500" 
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04M12 3v18" /></svg>}
                                description="Healthy Packages" 
                                trend="+2.1%"
                            />
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-sm">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Asset Distribution</h4>
                             <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="flex justify-center gap-4 mt-4">
                                {chartData.map((entry) => (
                                    <div key={entry.name} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{entry.name}</span>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Integrity</h4>
                                <p className="text-3xl font-black text-slate-900 tracking-tight">STABLE</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Normal operational parameters.</p>
                            </div>
                            <div className="space-y-3 mt-8">
                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                    <span>Sync Status</span>
                                    <span className="text-indigo-600">Active</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full w-[88%] bg-indigo-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4">
                    <div className="bg-white border border-slate-200/60 rounded-[32px] p-8 h-full relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16"></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 relative z-10">Neural Feed</h4>
                        <div className="space-y-8 relative z-10">
                            {[
                                { title: "Update Detected", desc: "React v19.2 is available", time: "5m ago", color: "bg-indigo-600" },
                                { title: "Scan Finished", desc: "No critical leaks found", time: "1h ago", color: "bg-emerald-500" },
                                { title: "System Ready", desc: "All modules synchronized", time: "4h ago", color: "bg-slate-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 group cursor-pointer">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-1.5 h-1.5 ${item.color} rounded-full ring-4 ring-slate-50`}></div>
                                        <div className="w-px h-full bg-slate-100 mt-2"></div>
                                    </div>
                                    <div className="space-y-1 pb-2">
                                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-16 pb-20">
                {error ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                        <div className="p-4 bg-rose-50 rounded-2xl mb-4">
                            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{error}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Check repository for package.json, requirements.txt, or pom.xml</p>
                    </div>
                ) : (
                    <>
                        <DependencyTable deps={dependencies} title="Production" loading={analysisLoading} filter={filter} />
                        <DependencyTable deps={devDependencies} title="Development" loading={analysisLoading} filter={filter} />
                    </>
                )}
            </div>
        </div>
    </div>
  );
}