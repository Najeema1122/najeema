import { createAdminToken, COOKIE_NAME } from "@/lib/admin-session";

export async function POST(request) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, SESSION_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SESSION_SECRET || SESSION_SECRET.length < 32) {
    return Response.json(
      { error: "Admin credentials are not configured. Check .env.local." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email !== ADMIN_EMAIL.trim().toLowerCase() || password !== ADMIN_PASSWORD) {
    return Response.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const response = Response.json({ email });
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${createAdminToken(ADMIN_EMAIL)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
  );
  return response;
}

