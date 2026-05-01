"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";

export function Navbar() {
    const pathname = usePathname();

    const links = [
        { name: "Dashboard", href: "/dashboard" },
    ];

    return (
        <nav className="bg-white/80 border-b border-slate-100 px-8 py-4 sticky top-0 z-50 backdrop-blur-md">
            <div className="max-w-[1500px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-10">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="h-12 w-auto flex items-center justify-start overflow-hidden group-hover:scale-105 transition-transform">
                            <Image 
                                src="/mdrLogo.png" 
                                alt="MDR Logo" 
                                width={160} 
                                height={48} 
                                className="h-full w-auto object-contain"
                                priority
                            />
                        </div>
                        <span className="font-black text-xl tracking-tighter uppercase italic text-slate-900">MDR</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    pathname === link.href
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        Logout
                    </button>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
                </div>
            </div>
        </nav>
    );
}
