import { useState } from "react";
import { redirect, useFetcher, useNavigate } from "@remix-run/react";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { signIn } from "~/services/auth.server";
import { createAuthSession } from "~/services/session.server";

export const action = async ({ request }: { request: Request }) => {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  const response = await signIn(request, email, password);
  console.log(response);
  if (response?.token) {
    const cookieHeader = await createAuthSession({
      accessToken: response.token,
      user: response.admin,
    });
    return redirect("/", {
      headers: { "Set-Cookie": cookieHeader },
    });
  } else {
    return {
      error: response.error,
    };
  }
};


export default function Login() {

  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const error = fetcher.data?.error;

  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = credentials;
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    fetcher.submit(formData, {
      method: 'post',
      action: '/login',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-admin-primary mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Softborn Admin Portal
          </h1>
          <p className="text-admin-muted mt-1">
            Sign in to manage your business
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="admin@softborn.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                  required
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-admin-border text-admin-primary focus:ring-admin-primary/20"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm text-admin-primary font-medium hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-admin-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-admin-muted mt-6">
          Softborn Admin Portal v1.0
        </p>
      </div>
    </div>
  );
}
