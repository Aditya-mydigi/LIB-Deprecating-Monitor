import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900">
            {children}
        </div>
    );
}
