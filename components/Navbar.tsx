"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function Navbar() {
    const pathname = usePathname();

    const links = [
        { name: "Dashboard", href: "/dashboard" },
    ];

    return (
        <nav className="bg-white dark:bg-[#030712] border-b border-gray-100 dark:border-gray-800 px-8 py-4 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
            <div className="max-w-[1500px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="font-black text-xl tracking-tighter uppercase italic">MDR</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    pathname === link.href
                                        ? "bg-gray-100 dark:bg-gray-800 text-blue-500"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        Logout
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 border dark:border-gray-700" />
                </div>
            </div>
        </nav>
    );
}
