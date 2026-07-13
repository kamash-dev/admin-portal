import { redirect } from "@remix-run/node";
import { getAccessToken, destroySession } from "~/services/session.server";

/**
 * Global API Configuration
 */
const getBaseUrl = (): string => {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error("BASE_URL environment variable is not set");
  }
  return baseUrl;
};

export interface ApiConfigOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headersOptions?: { [key: string]: string }
  isFormData?: boolean
}

/**
 * Single unified API function for all API calls
 * @param request - The Remix request object
 * @param apiUrl - The API endpoint path (e.g., "tenants/v1/storefront" or "catalog/v1/products")
 * @param options - Configuration options (method, body, headers)
 * @returns Promise<Response>
 */
export async function apiConfig(
  request: Request,
  apiUrl: string,
  options: ApiConfigOptions = {}
): Promise<Response> {
  const {
    method = "GET",
    body,
    headersOptions,
    isFormData = false
  } = options

  const baseUrl = getBaseUrl(); 
  
  // Build full URL
  const cleanPath = apiUrl.startsWith("/") ? apiUrl.slice(1) : apiUrl;
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const fullUrl = `${cleanBaseUrl}/${cleanPath}`;
  const forwardedFor = request.headers.get("X-Forwarded-For");
  // Build headers
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Forwarded-For": forwardedFor || "", 
    "connection": "keep-alive",
  };


  if (headersOptions) {
    headers = { ...headers, ...headersOptions };
  }
  // Add authentication token if required
  const token = await getAccessToken(request);
  if (token) {
      headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("headers", headers);

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Add body for POST, PUT, PATCH, DELETE requests
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    if (isFormData) {
      fetchOptions.body = body as FormData;
    } else {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  // Make the request
   const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }

}

/**
 * Helper function to parse JSON response and handle errors
 * Automatically handles 401 Unauthorized by destroying session and redirecting to home
 */
export async function fetchAPI<T = any>(
  request: Request,
  apiUrl: string,
  options: ApiConfigOptions = {}
): Promise<T> {
  const response = await apiConfig(request, apiUrl, options);

  // Handle 401 Unauthorized globally
  if (response.status === 401) {
    // Destroy session cookie
    const clearedCookieHeader = await destroySession();
    
    // Redirect to home page with cleared session cookie
    // Note: redirect() returns a Response that must be thrown
    throw redirect("/", {
      headers: {
        "Set-Cookie": clearedCookieHeader,
      },
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      console.log("errorJson", errorJson);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      if (errorText) {
        errorMessage = `${errorMessage} - ${errorText}`;
      }
    }
    console.error("API Error:", {
      errorMessage,
      response,
      options,
    });
    throw new Error(errorMessage);
  }
  const contentLength = response.headers.get("content-length");
  if(contentLength === "0" || response.status === 204) {
    return {
      status: "success",
      code: response.status,
      message: response.statusText,
      data: null,
    } as T;
  }
  return response.json() as T;
}
