import { createMailer, emailConfigReady, escapeHtml } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name || !email || !message) {
    return Response.json({ error: "Please complete every contact field." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (message.length > 5000) {
    return Response.json({ error: "The message must be 5,000 characters or fewer." }, { status: 400 });
  }
  if (!emailConfigReady()) {
    return Response.json({ error: "Gmail email settings are missing. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local." }, { status: 503 });
  }

  try {
    const mailer = createMailer();
    await mailer.sendMail({
      from: { name: "Najeema Portfolio", address: process.env.GMAIL_USER },
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `Portfolio contact message from ${name}`,
      html: `<h2>New portfolio message</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Gmail contact email failed:", error);
    return Response.json({ error: "The message could not be sent. Check the Gmail app password and settings." }, { status: 502 });
  }
}
