import { signInResponseType, AdminType } from "~/types/auth";
import { fetchAPI } from "~/utils/apiConfig.server";

/**
 * Get the currently authenticated admin's profile from the backend.
 * @param request - The Remix request object (must have a valid session cookie)
 * @returns The admin profile wrapped in `{ admin }`
 */
export async function getUserProfile(request: Request) {
  return fetchAPI<{ admin: AdminType }>(request, "admin/profile", {
    method: "GET",
  });
}

/**
 * Generate OTP for order verification
 * @param request - The Remix request object (must have valid session cookie)
 * @param email - User email address (for email delivery)
 * @param phone - User phone number (for SMS delivery)
 * @returns API response
 */

export async function signIn(
  request: Request,
  email: string,
  password: string,
) {
  const RequestBody = { email, password };
  console.log(RequestBody);
  return fetchAPI<signInResponseType>(request, "admin/login", {
    method: "POST",
    body: RequestBody,
  });
}


export async function signUp(
  request: Request,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string,
) {
  const RequestBody = { firstName, lastName, email, password, confirmPassword };
  return fetchAPI<signInResponseType>(request, "signup", {
    method: "POST",
    body: RequestBody,
  });
}