import { prisma } from "./db";
import { sendEmail } from "./mail";

interface CreateNotificationParams {
  userId: string;
  repoName: string;
  packageName: string;
  severity: "High" | "Medium" | "Low" | "Major" | "Critical" | string;
  message: string;
  userEmail?: string | null;
  currentVersion?: string;
  latestVersion?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  High: "#e11d48", // Rose 600
  Critical: "#9f1239", // Rose 800
  Major: "#f59e0b", // Amber 500
  Medium: "#ea580c", // Orange 600
  Low: "#059669", // Emerald 600
};

export async function createNotification({
  userId,
  repoName,
  packageName,
  severity,
  message,
  userEmail,
  currentVersion,
  latestVersion,
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

  // 2. Automatically send email if severity is High, Critical, or Major
  const triggerSeverities = ["high", "critical", "major"];
  if (triggerSeverities.includes(severity.toLowerCase()) && userEmail) {
    console.log(`${severity} severity detected for ${packageName}. Sending alert to ${userEmail}...`);
    
    const color = SEVERITY_COLORS[severity] || "#4f46e5";

    await sendEmail({
      to: userEmail,
      subject: `🚨 ${severity} Alert: ${packageName} in ${repoName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background-color: #f8fafc; }
            .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
            .header { border-bottom: 2px solid ${color}; padding-bottom: 16px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: ${color}; color: white; margin-bottom: 12px; }
            .repo-name { font-size: 14px; color: #64748b; margin-bottom: 4px; }
            .pkg-name { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; }
            .detail-row { display: flex; margin-bottom: 8px; font-size: 14px; }
            .detail-label { font-weight: 600; width: 120px; color: #475569; }
            .detail-value { color: #1e293b; }
            .message-box { background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 14px; color: #334155; margin: 20px 0; border-left: 4px solid #cbd5e1; }
            .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
            .button { display: inline-block; background: #4f46e5; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <span class="badge">${severity} Alert</span>
                <div class="repo-name">${repoName}</div>
                <h1 class="pkg-name">${packageName}</h1>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value" style="color: ${color}; font-weight: 700;">${severity} Update Required</div>
              </div>
              ${currentVersion ? `
              <div class="detail-row">
                <div class="detail-label">Current Version:</div>
                <div class="detail-value">${currentVersion}</div>
              </div>` : ""}
              ${latestVersion ? `
              <div class="detail-row">
                <div class="detail-label">Latest Version:</div>
                <div class="detail-value">${latestVersion}</div>
              </div>` : ""}

              <div class="message-box">
                <strong>Details:</strong><br/>
                ${message}
              </div>

              <a href="${process.env.NEXTAUTH_URL}/notifications" class="button">View in Dashboard</a>
            </div>
            <div class="footer">
              Sent by Lib-Deprecating Monitor &bull; Managed Dependencies
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${severity} Alert for ${packageName} in ${repoName}: ${message}`,
    });
  }

  return notification;
}

export async function sendConsolidatedReport(userEmail: string, reposCount: number, issues: any[]) {
  const highIssues = issues.filter(i => ["high", "critical", "major"].includes(i.severity.toLowerCase()));
  
  if (highIssues.length === 0) return;

  await sendEmail({
    to: userEmail,
    subject: `📋 Status Report: ${highIssues.length} Critical/Major Updates Found`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background: #f8fafc; }
          .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
          .title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
          .summary { color: #64748b; font-size: 14px; margin-bottom: 24px; }
          .issue-item { padding: 16px; border-bottom: 1px solid #f1f5f9; }
          .issue-item:last-child { border-bottom: none; }
          .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .issue-repo { font-size: 12px; color: #64748b; font-weight: 500; }
          .issue-pkg { font-weight: 700; color: #1e293b; }
          .issue-severity { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
          .major { background: #fef3c7; color: #92400e; }
          .critical { background: #fee2e2; color: #991b1b; }
          .button { display: block; text-align: center; background: #4f46e5; color: white !important; padding: 14px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 32px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1 class="title">Dependency Health Report</h1>
            <p class="summary">We found ${highIssues.length} high-impact updates across your ${reposCount} monitored repositories.</p>
            
            <div style="margin-top: 10px;">
              ${highIssues.map(issue => `
                <div class="issue-item">
                  <div class="issue-header">
                    <span class="issue-repo">${issue.repoName}</span>
                    <span class="issue-severity ${issue.severity.toLowerCase()}">${issue.severity}</span>
                  </div>
                  <div class="issue-pkg">${issue.packageName}</div>
                  <div style="font-size: 13px; color: #475569; margin-top: 4px;">${issue.message}</div>
                </div>
              `).join('')}
            </div>

            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Open Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Status Report: ${highIssues.length} updates found.`,
  });
}
