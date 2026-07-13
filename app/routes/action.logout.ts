import { redirect } from "@remix-run/node";
import { destroySession } from "~/services/session.server";

/**
 * Logout Route
 * Handles user logout by clearing session and redirecting to homepage
 */
export const action = async () => {
  try {
    // Call logout API to invalidate token on server (optional but recommended)
    // Clear session cookie
    const cookieHeader = await destroySession();

    // Redirect to homepage with cleared session cookie
    return redirect("/", {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's an error, try to clear the session and redirect
    const cookieHeader = await destroySession();
    return redirect("/login", {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    });
  }
};

