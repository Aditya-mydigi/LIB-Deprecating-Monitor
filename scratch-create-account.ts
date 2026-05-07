import nodemailer from "nodemailer";

async function create() {
  console.log("Generating Ethereal test account...");
  try {
    const account = await nodemailer.createTestAccount();
    console.log("--- COPY THESE TO .env.local ---");
    console.log(`SMTP_HOST=${account.smtp.host}`);
    console.log(`SMTP_PORT=${account.smtp.port}`);
    console.log(`SMTP_SECURE=${account.smtp.secure}`);
    console.log(`SMTP_USER=${account.user}`);
    console.log(`SMTP_PASS=${account.pass}`);
    console.log(`SMTP_FROM_EMAIL=${account.user}`);
    console.log("--------------------------------");
    console.log("You can view sent emails at: " + nodemailer.getTestMessageUrl({ messageId: 'test' })); // This is just a placeholder to show the domain
    console.log("Actually, Ethereal provides a login URL: https://ethereal.email/login");
  } catch (err) {
    console.error("Failed to create test account:", err);
  }
}

create();
