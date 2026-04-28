import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { repos } = await req.json(); // Array of { name, full_name, isActive }

        // Find or create the user in local DB if not exists
        // (For internal tool, we can just use a fixed ID or sync based on session name)
        let user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: session.user.name || "admin",
                    password: "password_not_needed_for_oauth" // Hardcoded since we use credentials or oauth
                }
            });
        }

        // Sync repos
        for (const r of repos) {
            await prisma.repo.upsert({
                where: { id: `${user.id}-${r.full_name}` }, // Compound unique or just id? I'll use a prefix for simple cuid
                update: { isActive: r.isActive },
                create: {
                   // Using full_name as a unique-ish ID for this user's repo integration
                   id: `${user.id}-${r.full_name}`,
                   userId: user.id,
                   name: r.name,
                   fullName: r.full_name,
                   isActive: r.isActive
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" },
            include: { repos: true }
        });

        return NextResponse.json({ repos: user?.repos || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
