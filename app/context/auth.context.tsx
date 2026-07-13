import { createContext, useContext, useMemo } from "react";
import { useRouteLoaderData } from "@remix-run/react";
import type { AdminType } from "~/types/auth";

type AuthContextType = {
  isLoggedIn: boolean;
  user: AdminType | null;
  isLoaded: boolean;
};

type RootLoaderData = {
  isLoggedIn: boolean;
  user: AdminType | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const rootData = useRouteLoaderData<RootLoaderData>("root");

  const contextValue = useMemo<AuthContextType>(() => {
    if (!rootData) {
      return {
        isLoggedIn: false,
        user: null,
        isLoaded: false,
      };
    }
    return {
      isLoggedIn: rootData.isLoggedIn ?? false,
      user: rootData.user ?? null,
      isLoaded: true,
    };
  }, [rootData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
