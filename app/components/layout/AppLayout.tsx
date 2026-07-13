import type { ReactNode } from "react";
import { useLocation } from "@remix-run/react";
import { useAuth } from "~/context/auth.context";
import Sidebar from "~/components/layout/Sidebar";
import Header from "~/components/layout/Header";
import { Toaster } from "~/components/sonner";

const PUBLIC_PATHS = ["/login"];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isLoggedIn, isLoaded } = useAuth();
  console.log(isLoggedIn, isLoaded);
  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-admin-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-admin-muted font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPublicPage || !isLoaded) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-admin-bg">
      <Toaster />
      <Sidebar />
      <div className="pl-64 transition-all duration-300">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
