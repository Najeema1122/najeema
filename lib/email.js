import nodemailer from "nodemailer";

let transporter;

export function emailConfigReady() {
  return Boolean(
    process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD &&
      process.env.ADMIN_EMAIL
  );
}

export function createMailer() {
  if (!emailConfigReady()) {
    throw new Error("Missing Gmail mail settings. Check .env.local.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
