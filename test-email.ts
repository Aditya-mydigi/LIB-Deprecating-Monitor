import * as dotenv from "dotenv";
// Load environment variables FIRST before importing any other files that use them
dotenv.config({ path: ".env.local" });

import { sendEmail } from "./lib/mail";

async function test() {
  console.log("Testing Email Configuration...");
  console.log("SMTP Host:", process.env.SMTP_HOST);
  console.log("SMTP User:", process.env.SMTP_USER);

  if (!process.env.SMTP_HOST) {
    console.error("❌ Error: SMTP_HOST is not defined. Check your .env.local file.");
    return;
  }

  const result = await sendEmail({
    to: process.env.SMTP_USER || "test@example.com", 
    subject: "🚀 Nodemailer Test - Lib Monitor",
    html: "<h1>It works!</h1><p>If you are seeing this, your Nodemailer configuration is correct.</p>",
    text: "It works! Your Nodemailer configuration is correct.",
  });

  if (result.success) {
    console.log("✅ Success! Check your inbox at https://ethereal.email/messages");
  } else {
    console.log("❌ Failed!");
    console.error(result.error);
  }
}

test();
