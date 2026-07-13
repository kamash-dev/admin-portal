import { createCookie } from "@remix-run/node";
import { AdminType } from "~/types/auth";

// Get session secret from environment variables
const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  // if (!secret && process.env.NODE_ENV === "production") {
  //   throw new Error("SESSION_SECRET must be set in production environment");
  // }
  // In development, use a default secret if not provided (not recommended for production)
  return secret || "emergency-fallback-secret";
};

export const sessionCookie = createCookie("session", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  secrets: [getSessionSecret()],
});

export async function createAuthSession(data: { accessToken: string, user: AdminType }) {
  return sessionCookie.serialize(data);
}

export async function getAccessToken(request: Request) {
  const cookie = request.headers.get("Cookie");
  const session = await sessionCookie.parse(cookie);
  return session?.accessToken;
}

export async function getUser(request: Request) {
  const cookie = request.headers.get("Cookie");
  const session = await sessionCookie.parse(cookie);
  return session?.user;
}

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionCookie.parse(cookie);
}
/**
 * Check if user is authenticated (has active session)
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const token = await getAccessToken(request);
  return !!token;
}

/**
 * Destroy session cookie by setting it to expire immediately
 */
export async function destroySession() {
  return sessionCookie.serialize("", {
    maxAge: 0,
  });
}

