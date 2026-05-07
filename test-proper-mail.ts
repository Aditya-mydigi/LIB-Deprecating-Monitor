import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createNotification } from "./lib/notification-service";
import { prisma } from "./lib/db";

async function testProperMail() {
  console.log("🚀 Testing Proper Mail System...");

  // Get a dummy user or create one for testing
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found, creating test user...");
    user = await prisma.user.create({
      data: {
        username: "testuser",
        password: "password123",
      }
    });
  }

  const testEmail = process.env.SMTP_USER || "your-email@example.com";

  console.log(`Sending a CRITICAL alert for ${testEmail}...`);
  await createNotification({
    userId: user.id,
    repoName: "main-production-api",
    packageName: "express",
    severity: "Critical",
    message: "Security Vulnerability CVE-2024-XXXX: Remote Code Execution found in version 4.17.1. Immediate update to 4.19.2 required.",
    userEmail: testEmail,
    currentVersion: "4.17.1",
    latestVersion: "4.19.2"
  });

  console.log(`Sending a MAJOR update alert...`);
  await createNotification({
    userId: user.id,
    repoName: "frontend-dashboard",
    packageName: "next",
    severity: "Major",
    message: "Major version jump detected. Next.js 15 introduces breaking changes in routing and data fetching.",
    userEmail: testEmail,
    currentVersion: "14.2.0",
    latestVersion: "15.0.0"
  });

  console.log("✅ Done! Check your Ethereal inbox at https://ethereal.email/messages");
}

testProperMail()
  .catch(err => console.error("Error:", err))
  .finally(() => process.exit());
