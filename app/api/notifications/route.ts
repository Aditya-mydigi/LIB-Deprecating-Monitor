import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    try {
        const user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" }
        });

        if (!user) return NextResponse.json({ notifications: [], total: 0 });

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({
                where: { userId: user.id }
            })
        ]);

        return NextResponse.json({ 
            notifications, 
            total, 
            page, 
            limit,
            totalPages: Math.ceil(total / limit) 
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, isRead } = await req.json();
        
        // Ensure user owns the notification
        const user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const notification = await prisma.notification.update({
            where: { id, userId: user.id },
            data: { isRead }
        });

        return NextResponse.json(notification);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        await prisma.notification.delete({
            where: { id, userId: user.id }
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
