import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let email = "";

  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || email.length > 254 || !emailPattern.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const domain = process.env.AUTH0_DOMAIN
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
  const clientId = process.env.AUTH0_CLIENT_ID;
  const connection = process.env.AUTH0_CONNECTION || "Username-Password-Authentication";

  if (!domain || domain === "auth0.auth0.com" || !clientId) {
    console.error("Password reset is unavailable because Auth0 is not configured.");
    return NextResponse.json({ error: "Password reset is unavailable." }, { status: 503 });
  }

  try {
    const response = await fetch(`https://${domain}/dbconnections/change_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, email, connection }),
      cache: "no-store",
    });

    // Auth0 returns 404 when an address is unknown. Use the same response as a
    // successful request so this endpoint cannot be used to discover accounts.
    if (response.ok || response.status === 404) {
      return NextResponse.json({ ok: true });
    }

    console.error("Auth0 password reset request failed.", { status: response.status });
    return NextResponse.json({ error: "Password reset is unavailable." }, { status: 503 });
  } catch (error) {
    console.error("Auth0 password reset request failed.", error);
    return NextResponse.json({ error: "Password reset is unavailable." }, { status: 503 });
  }
}
