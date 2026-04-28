import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const activeRepos = await prisma.repo.findMany({
            where: { isActive: true }
        });

        // For now, since we don't store full scan results in DB yet, 
        // we'll return the list and count. 
        // In a real app, this would aggregate data from a 'Scan' table.
        return NextResponse.json({
            totalRepos: activeRepos.length,
            repos: activeRepos
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
