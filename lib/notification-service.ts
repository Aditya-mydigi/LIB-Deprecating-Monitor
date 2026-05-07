import { prisma } from "./db";
import { sendEmail } from "./mail";

interface CreateNotificationParams {
  userId: string;
  repoName: string;
  packageName: string;
  severity: "High" | "Medium" | "Low" | string;
  message: string;
  userEmail?: string | null;
}

export async function createNotification({
  userId,
  repoName,
  packageName,
  severity,
  message,
  userEmail,
}: CreateNotificationParams) {
  // 1. Save to Database
  const notification = await prisma.notification.create({
    data: {
      userId,
      repoName,
      packageName,
      severity,
      message,
    },
  });

  // 2. Automatically send email if severity is High
  if (severity.toLowerCase() === "high" && userEmail) {
    console.log(`High severity detected for ${packageName}. Sending email to ${userEmail}...`);
    
    await sendEmail({
      to: userEmail,
      subject: `🚨 High Severity Alert: ${packageName} in ${repoName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #d32f2f;">High Severity Vulnerability Found</h2>
          <p>A high severity issue has been detected in your repository.</p>
          <hr />
          <p><strong>Repository:</strong> ${repoName}</p>
          <p><strong>Package:</strong> ${packageName}</p>
          <p><strong>Message:</strong> ${message}</p>
          <br />
          <a href="${process.env.NEXTAUTH_URL}/notifications" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Notifications</a>
        </div>
      `,
      text: `High Severity Alert: ${packageName} in ${repoName}. Message: ${message}`,
    });
  }

  return notification;
}
