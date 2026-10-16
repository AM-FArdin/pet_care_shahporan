import { NextResponse } from "next/server";
import { validateCredentials, createSessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const isValid = validateCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password or username. Access restricted to clinic admins." },
        { status: 401 }
      );
    }

    const safeUsername = username?.trim() || "admin";
    const token = await createSessionToken(safeUsername);

    const response = NextResponse.json({
      success: true,
      user: { username: safeUsername, role: "admin" },
      message: "Admin authentication successful",
    });

    // Set HTTP-only secure cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal authentication error" }, { status: 500 });
  }
}
