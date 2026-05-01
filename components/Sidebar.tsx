"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarLinks = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: "Repositories",
        href: "/repositories",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
    {
        name: "Notifications",
        href: "#",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        name: "Profile",
        href: "#",
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
            <div className="flex-1 py-8 px-4 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 mb-4">Core Platform</p>
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all group ${
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : link.disabled
                                    ? "text-slate-300 cursor-not-allowed opacity-60"
                                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            }`}
                        >
                            <span className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"} transition-colors`}>
                                {link.icon}
                            </span>
                            {link.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Environment</p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] font-black text-slate-900 uppercase">Production v1.2</p>
                        <div className="flex gap-0.5">
                            <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                            <span className="w-1 h-3 bg-indigo-500/30 rounded-full"></span>
                            <span className="w-1 h-3 bg-indigo-500/10 rounded-full"></span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
