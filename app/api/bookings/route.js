import { createMailer, emailConfigReady, escapeHtml } from "@/lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const agenda = typeof body.agenda === "string" ? body.agenda.trim() : "";
  const date = new Date(body.preferredDateTime);
  const timeZone = typeof body.timeZone === "string" ? body.timeZone : "UTC";

  if (!fullName || !email || !agenda || !body.preferredDateTime) {
    return Response.json({ error: "Please complete every booking field." }, { status: 400 });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (agenda.length > 3000) {
    return Response.json({ error: "The agenda must be 3,000 characters or fewer." }, { status: 400 });
  }
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return Response.json({ error: "Choose a future date and time." }, { status: 400 });
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(date);
  } catch {
    return Response.json({ error: "The selected time zone is invalid." }, { status: 400 });
  }
  if (!emailConfigReady()) {
    return Response.json({ error: "Gmail email settings are missing. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local." }, { status: 503 });
  }

  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeAgenda = escapeHtml(agenda).replace(/\n/g, "<br>");
  const requestedTime = new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(date);

  try {
    const mailer = createMailer();
    const from = { name: "Najeema Portfolio", address: process.env.GMAIL_USER };
    await Promise.all([
      mailer.sendMail({
        from,
        to: process.env.ADMIN_EMAIL,
        replyTo: email,
        subject: `Portfolio meeting request from ${fullName}`,
        html: `<h2>New meeting request</h2><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Requested time:</strong> ${escapeHtml(requestedTime)} (${escapeHtml(timeZone)})</p><p><strong>Agenda:</strong><br>${safeAgenda}</p>`,
      }),
      mailer.sendMail({
        from,
        to: email,
        subject: "Thank you for your meeting request",
        html: `<p>Hello ${safeName},</p><p>Thank you for requesting a meeting for <strong>${escapeHtml(requestedTime)} (${escapeHtml(timeZone)})</strong>.</p><p>Your meeting invite or link will be sent soon.</p><p>Best,<br>Najeema</p>`,
      }),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Gmail booking email failed:", error);
    return Response.json({ error: "The booking emails could not be sent. Check the Gmail app password and settings." }, { status: 502 });
  }
}
