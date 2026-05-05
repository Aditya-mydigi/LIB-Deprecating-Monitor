import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { username: session.user.name || "admin" }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const mockNotifications = [
            {
                repoName: "frontend-dashboard",
                packageName: "lodash",
                severity: "High",
                message: "High lodash requires your attention.",
                userId: user.id
            },
            {
                repoName: "backend-api",
                packageName: "express",
                severity: "Medium",
                message: "Medium express requires your attention.",
                userId: user.id
            },
            {
                repoName: "auth-service",
                packageName: "jsonwebtoken",
                severity: "High",
                message: "High jsonwebtoken requires your attention.",
                userId: user.id
            },
            {
                repoName: "ui-components",
                packageName: "tailwind-merge",
                severity: "Low",
                message: "Low tailwind-merge requires your attention.",
                userId: user.id
            },
            {
                repoName: "data-parser",
                packageName: "axios",
                severity: "Medium",
                message: "Medium axios requires your attention.",
                userId: user.id
            },
            {
                repoName: "frontend-dashboard",
                packageName: "react-query",
                severity: "Low",
                message: "Low react-query requires your attention.",
                userId: user.id
            },
            {
                repoName: "legacy-app",
                packageName: "moment",
                severity: "High",
                message: "High moment requires your attention.",
                userId: user.id
            },
            {
                repoName: "backend-api",
                packageName: "cors",
                severity: "Low",
                message: "Low cors requires your attention.",
                userId: user.id
            },
            {
                repoName: "auth-service",
                packageName: "bcryptjs",
                severity: "Medium",
                message: "Medium bcryptjs requires your attention.",
                userId: user.id
            },
            {
                repoName: "ui-components",
                packageName: "framer-motion",
                severity: "Low",
                message: "Low framer-motion requires your attention.",
                userId: user.id
            },
            {
                repoName: "data-parser",
                packageName: "zod",
                severity: "Medium",
                message: "Medium zod requires your attention.",
                userId: user.id
            },
            {
                repoName: "frontend-dashboard",
                packageName: "next-auth",
                severity: "High",
                message: "High next-auth requires your attention.",
                userId: user.id
            }
        ];

        // Add some random dates
        const createdNotifications = [];
        for (const n of mockNotifications) {
            const date = new Date();
            date.setHours(date.getHours() - Math.floor(Math.random() * 100));
            
            createdNotifications.push(
                await prisma.notification.create({
                    data: {
                        ...n,
                        createdAt: date
                    }
                })
            );
        }

        return NextResponse.json({ success: true, count: createdNotifications.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
