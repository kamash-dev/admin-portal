import { signInResponseType } from "~/types/auth";
import { fetchAPI } from "~/utils/apiConfig.server";

/**
 * Get user profile from identity API
 * @param request - The Remix request object (must have valid session cookie)
 * @returns User profile data
 */
export async function getUserProfile(request: Request) {
  return fetchAPI<{ data: any }>(request, "identity/v1/profile", {
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