import { Navbar } from "@/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#030712] text-white">
            <Navbar />
            {children}
        </div>
    );
}
