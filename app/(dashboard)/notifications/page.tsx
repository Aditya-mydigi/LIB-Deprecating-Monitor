"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
    Bell, 
    CheckCircle2, 
    Circle, 
    Trash2, 
    AlertTriangle, 
    AlertCircle, 
    Info, 
    ChevronLeft, 
    ChevronRight,
    Loader2,
    RefreshCw
} from "lucide-react";

interface Notification {
    id: string;
    repoName: string;
    packageName: string;
    severity: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchNotifications = async (p: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?page=${p}&limit=${limit}`);
            const data = await res.json();
            setNotifications(data.notifications || []);
            setTotalPages(data.totalPages || 1);
            setPage(data.page || 1);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(page);
    }, [page]);

    const toggleRead = async (id: string, currentRead: boolean) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isRead: !currentRead }),
            });
            if (res.ok) {
                setNotifications(notifications.map(n => 
                    n.id === id ? { ...n, isRead: !currentRead } : n
                ));
            }
        } catch (error) {
            console.error("Failed to update notification:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setNotifications(notifications.filter(n => n.id !== id));
                // Refetch if page is empty
                if (notifications.length === 1 && page > 1) {
                    setPage(page - 1);
                } else {
                    fetchNotifications(page);
                }
            }
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "high":
                return "bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/10";
            case "medium":
                return "bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10";
            case "low":
                return "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100 ring-slate-500/10";
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "high":
                return <AlertCircle className="w-3.5 h-3.5" />;
            case "medium":
                return <AlertTriangle className="w-3.5 h-3.5" />;
            case "low":
                return <Info className="w-3.5 h-3.5" />;
            default:
                return <Bell className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="p-10 max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
                    </div>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] ml-1">
                        Monitoring {total} active alerts across your projects
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={async () => {
                            await fetch("/api/notifications/seed", { method: "POST" });
                            fetchNotifications(1);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                        Seed Data
                    </button>
                    <button 
                        onClick={() => fetchNotifications(page)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
                    >
                        <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {loading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-ping absolute" />
                        <div className="w-16 h-16 border-4 border-t-indigo-600 border-transparent rounded-full animate-spin relative z-10" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing with backend...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-slate-200 border-dashed shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                        <Bell className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-black text-lg mb-2">All caught up!</h3>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">No new notifications at the moment</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4">
                        {notifications.map((n) => (
                            <div 
                                key={n.id}
                                className={`group relative bg-white rounded-[2rem] border transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-500/10 ${
                                    n.isRead ? "border-slate-100 bg-slate-50/50" : "border-slate-200 shadow-sm"
                                }`}
                            >
                                <div className="p-8 flex items-start justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getSeverityStyles(n.severity)}`}>
                                                {getSeverityIcon(n.severity)}
                                                {n.severity}
                                            </span>
                                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 px-3 py-1.5 rounded-full">
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-lg font-black tracking-tight ${n.isRead ? "text-slate-500" : "text-slate-900"}`}>
                                                    {n.repoName}
                                                </h3>
                                                <span className="text-slate-300">/</span>
                                                <h3 className={`text-lg font-bold tracking-tight ${n.isRead ? "text-slate-400" : "text-indigo-600"}`}>
                                                    {n.packageName}
                                                </h3>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${n.isRead ? "text-slate-400 font-medium" : "text-slate-600 font-semibold"}`}>
                                                {n.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <button 
                                            onClick={() => toggleRead(n.id, n.isRead)}
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                                n.isRead 
                                                    ? "text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-lg" 
                                                    : "text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-600/20"
                                            }`}
                                            title={n.isRead ? "Mark as unread" : "Mark as read"}
                                        >
                                            {n.isRead ? <Circle className="w-6 h-6" strokeWidth={2.5} /> : <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />}
                                        </button>
                                        <button 
                                            onClick={() => deleteNotification(n.id)}
                                            className="w-12 h-12 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-rose-600/10"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-6 h-6" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <div className="absolute left-[-1px] top-8 bottom-8 w-1.5 bg-indigo-600 rounded-r-full shadow-[4px_0_12px_rgba(79,70,229,0.4)]" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                                    Showing page {page}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    of {totalPages} total pages
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                    disabled={page === 1}
                                    className="p-4 border border-slate-200 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-indigo-200 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5 transition-all shadow-sm bg-white"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex gap-1.5">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setPage(i + 1)}
                                            className={`w-12 h-12 rounded-2xl text-[11px] font-black transition-all ${
                                                page === i + 1 
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                                    : "bg-white text-slate-400 hover:text-indigo-600 border border-slate-100"
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={page === totalPages}
                                    className="p-4 border border-slate-200 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white hover:border-indigo-200 hover:text-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5 transition-all shadow-sm bg-white"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
