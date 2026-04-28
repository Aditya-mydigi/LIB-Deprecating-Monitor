"use client";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#030712] flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
