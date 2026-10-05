import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getTokens, logoutUser, onAuthChange } from "./api-client";

export type SessionUser = { signedIn: true };

export function useAuthSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setUser(getTokens()?.accessToken ? { signedIn: true } : null);
      setLoading(false);
    };
    sync();
    const off = onAuthChange(sync);
    window.addEventListener("storage", sync);
    return () => {
      off();
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, loading };
}

/** Redirects to /login?redirect=<current path> when there is no session. */
export function useRequireAuth() {
  const { user, loading } = useAuthSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/login", search: { redirect: pathname } });
    }
  }, [loading, user, navigate, pathname]);

  return { user, loading };
}

export async function signOut() {
  await logoutUser();
}
