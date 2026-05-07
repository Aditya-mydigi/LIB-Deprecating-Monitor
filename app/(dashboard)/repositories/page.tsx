"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { GitHubRepo } from "@/lib/github";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function RepositoriesPage() {
    const { data: session, status } = useSession();
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [monitoredFullNames, setMonitoredFullNames] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        /* 
        if (status === "authenticated" && !(session as any)?.accessToken) {
            router.push("/connect-github");
            return;
        }
        */

        const fetchData = async () => {
            try {
                const githubRes = await fetch("/api/github/repos");
                const githubData = await githubRes.json();
                const githubRepos = githubData.repos || [];

                const dbRes = await fetch("/api/repos");
                const dbData = await dbRes.json();
                const dbRepos = dbData.repos || [];

                const activeFullNames = dbRepos
                    .filter((r: any) => r.isActive)
                    .map((r: any) => r.fullName);
                const activeSet = new Set<string>(activeFullNames);
                setMonitoredFullNames(activeSet);

                // Combine GitHub repos and Manual repos
                const manualRepos = dbRepos
                    .filter((r: any) => r.fullName.startsWith("manual/"))
                    .map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        full_name: r.fullName,
                        language: "Manual",
                        owner: "manual",
                        isActive: r.isActive
                    }));

                // Filter GitHub repos to only show active ones as per previous logic (or show all?)
                // Actually, the previous code filtered them: githubData.repos.filter((r: any) => activeSet.has(r.full_name))
                const activeGithubRepos = githubRepos.filter((r: any) => activeSet.has(r.full_name));

                setRepos([...activeGithubRepos, ...manualRepos]);
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

    const handleToggleRepo = async (repo: GitHubRepo) => {
        const next = new Set(monitoredFullNames);
        let isActive = false;
        if (next.has(repo.full_name)) {
            next.delete(repo.full_name);
            isActive = false;
        } else {
            next.add(repo.full_name);
            isActive = true;
        }
        setMonitoredFullNames(next);

        // Immediate save for better UX
        try {
            await fetch("/api/repos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repos: [{
                        name: repo.name,
                        full_name: repo.full_name,
                        isActive: isActive
                    }]
                })
            });
        } catch (err) {
            console.error("Failed to sync repo status", err);
        }
    };

    const handleDeleteRepo = async (repo: GitHubRepo) => {
        try {
            const res = await fetch("/api/repos", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: repo.full_name })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete repository");
            }

            setRepos((current) => current.filter((item) => item.full_name !== repo.full_name));
            const next = new Set(monitoredFullNames);
            next.delete(repo.full_name);
            setMonitoredFullNames(next);
        } catch (err: any) {
            console.error("Failed to delete repo", err);
            alert(err.message || "Unable to delete repository");
        }
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

    const handleManualClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const name = prompt("Enter a name for this repository:", file.name);
        if (!name) return; // Cancel if no name

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);

        try {
            const res = await fetch("/api/manual/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            // Redirect to dashboard with the new repo selected
            router.push(`/dashboard?repo=${data.fullName}`);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    const [showConnectModal, setShowConnectModal] = useState(false);

    if (status === "loading") return null;

    return (
        <>
        <div className="p-8 space-y-12 animate-slide-up max-w-[1400px] mx-auto">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-100">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-slate-900">Repositories </h1>
                    <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase mt-2">Centralized Source Control Management</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push("/onboarding")}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs active:scale-[0.98] flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                        Update Selection
                    </button>
                    <button
                        onClick={() => setShowConnectModal(true)}
                        className="px-10 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-black rounded-2xl transition-all shadow-sm uppercase tracking-widest text-xs active:scale-[0.98] flex items-center gap-2"
                    >
                        Connect New
                    </button>
                </div>
            </header>

            {/* Repositories Table */}
            <div className="bg-white border border-slate-200/60 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Repo Name</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Identifier</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Platform</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Libraries</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Language</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : repos.length > 0 ? (
                                repos.map((repo) => {
                                    const isActive = monitoredFullNames.has(repo.full_name);
                                    return (
                                        <tr key={repo.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div onClick={() => handleToggleRepo(repo)} className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isActive ? "bg-indigo-600 border-indigo-600" : "border-slate-200 hover:border-indigo-400"}`}>
                                                        {isActive && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                    <span className="font-black text-[13px] text-slate-900">{repo.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400 font-mono">{repo.id}</td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                                                    {isActive ? "Connected" : "Disconnected"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {repo.full_name.startsWith("manual/") ? (
                                                        <>
                                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Manual</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">GitHub</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-[11px] font-black text-indigo-600">--</td>
                                            <td className="px-8 py-6">
                                                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-100">{repo.language || "N/A"}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => router.push(`/dashboard?repo=${repo.full_name}`)} className="p-2.5 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100 shadow-sm" title="Show Overview">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                    <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200 shadow-sm" title="Update">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteRepo(repo)} className="p-2.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 shadow-sm" title="Delete Repository">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-black uppercase italic tracking-tighter text-lg">No Repositories Synced</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Connect your GitHub account to begin monitoring</p>
                                            </div>
                                            <button
                                                onClick={() => setShowConnectModal(true)}
                                                className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                            >
                                                Connect Now
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

            {/* Connect Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
                        onClick={() => setShowConnectModal(false)}
                    ></div>
                    
                    <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-[0_0_40px_-10px_rgba(79,70,229,0.15)] border border-white/50 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                        {/* Decorative Top Gradient */}
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        
                        <div className="p-10 sm:p-14 space-y-12">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
                                    <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                    </svg>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                                    Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Workspace</span>
                                </h2>
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Select your source control provider</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[
                                    { 
                                        name: "GitHub", 
                                        description: "Connect to your GitHub repositories",
                                        icon: <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />,
                                        colorClass: "hover:bg-[#24292F] hover:border-[#24292F]",
                                        iconColor: "text-[#24292F]",
                                        ready: true 
                                    },
                                    { 
                                        name: "Bitbucket", 
                                        description: "Import from Bitbucket workspace",
                                        icon: <path d="M1.378 1.704a.798.798 0 00-.795.897l2.25 18.665c.04.33.32.576.65.576h16.89c.333 0 .61-.246.65-.576l2.25-18.665a.798.798 0 00-.795-.897H1.378zM17.062 14.5H6.938L5.75 5.5h12.5l-1.188 9z" />,
                                        colorClass: "hover:bg-[#2684FF] hover:border-[#2684FF]",
                                        iconColor: "text-[#2684FF]",
                                        ready: false 
                                    },
                                    { 
                                        name: "GitLab", 
                                        description: "Connect to GitLab projects",
                                        icon: <path d="M22.65 14.39L20.21 6.8a.76.76 0 00-.28-.38.76.76 0 00-.47-.14.76.76 0 00-.47.14.76.76 0 00-.28.38l-2.44 7.59H5.73l-2.44-7.59a.75.75 0 00-.28-.38.76.76 0 00-.47-.14.76.76 0 00-.47.14.76.76 0 00-.28.38L1.35 14.39a.75.75 0 00.27.84l10.15 7.37a.76.76 0 00.43.14.76.76 0 00.43-.14l10.15-7.37a.75.75 0 00.27-.84z" />,
                                        colorClass: "hover:bg-[#FC6D26] hover:border-[#FC6D26]",
                                        iconColor: "text-[#FC6D26]",
                                        ready: false 
                                    },
                                    { 
                                        name: "Manual Upload", 
                                        description: "Upload package files directly",
                                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
                                        colorClass: "hover:bg-indigo-600 hover:border-indigo-600",
                                        iconColor: "text-indigo-600",
                                        ready: true,
                                        isStroke: true
                                    },
                                ].map((platform) => (
                                    <button
                                        key={platform.name}
                                        onClick={() => {
                                            if (!platform.ready) return;
                                            if (platform.name === "GitHub") {
                                                signIn("github", { callbackUrl: "/onboarding" });
                                            } else if (platform.name === "Manual Upload") {
                                                handleManualClick();
                                            }
                                        }}
                                        disabled={uploading || !platform.ready}
                                        className={`relative p-6 rounded-3xl border-2 border-slate-100 bg-white transition-all duration-300 group text-left flex items-start gap-5
                                            ${platform.ready ? `hover:shadow-xl hover:-translate-y-1 ${platform.colorClass}` : 'opacity-60 cursor-not-allowed grayscale'}`}
                                    >
                                        <div className={`p-3 rounded-2xl bg-slate-50 transition-colors duration-300 flex-shrink-0 ${platform.ready ? 'group-hover:bg-white/20' : ''}`}>
                                            <svg className={`w-8 h-8 transition-colors duration-300 ${platform.ready ? `${platform.iconColor} group-hover:text-white` : 'text-slate-400'}`} fill={platform.isStroke ? "none" : "currentColor"} viewBox="0 0 24 24" stroke={platform.isStroke ? "currentColor" : "none"}>
                                                {platform.icon}
                                            </svg>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <h3 className={`font-black text-lg text-slate-900 transition-colors duration-300 ${platform.ready ? 'group-hover:text-white' : ''}`}>
                                                {platform.name}
                                            </h3>
                                            <p className={`text-xs font-semibold text-slate-400 transition-colors duration-300 ${platform.ready ? 'group-hover:text-white/80' : ''}`}>
                                                {platform.description}
                                            </p>
                                        </div>
                                        {!platform.ready && (
                                            <div className="absolute top-4 right-4 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                                Coming Soon
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="bg-slate-50/80 p-6 border-t border-slate-100/50">
                            <button
                                onClick={() => setShowConnectModal(false)}
                                className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm hover:shadow"
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".json,.txt,.toml,.xml"
            />
        </>
    );
}
