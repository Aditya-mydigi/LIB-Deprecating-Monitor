"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export function Header() {
    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 grad-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div className="flex flex-col -space-y-1">
                    <span className="font-black text-xl tracking-tighter uppercase grad-text">MDR</span>
                    <span className="text-[8px] font-bold text-slate-400 tracking-[0.3em] uppercase">Monitor</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Active Node</span>
                </div>

                <button className="text-slate-400 hover:text-indigo-600 transition-all relative p-2 hover:bg-indigo-50 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="group relative">
                    <button className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden hover:border-indigo-300 transition-all shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </button>
                    <div className="absolute right-0 top-full pt-2 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl py-2 min-w-[180px] overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator</p>
                                <p className="text-[11px] font-black text-slate-900 truncate">System Admin</p>
                            </div>
                            <button className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Change Password
                            </button>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
