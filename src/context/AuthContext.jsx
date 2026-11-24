// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { api, APP_NAME } from "../api/api";

export const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_SESSION_MS = 8 * 60 * 60 * 1000;
const ACTIVITY_PERSIST_INTERVAL_MS = 30 * 1000;
const STAFF_ROLES = ["admin", "guru"];

const SESSION_KEY = `${APP_NAME}_session`;

const readStoredSession = () => {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  try {
    const session = JSON.parse(saved);
    if (
      !session?.user ||
      !Number.isFinite(session.createdAt) ||
      !Number.isFinite(session.lastActivityAt)
    ) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    const now = Date.now();
    const hasTimeoutExemption = STAFF_ROLES.includes(session.user.role);
    if (
      !hasTimeoutExemption &&
      (now - session.lastActivityAt >= IDLE_TIMEOUT_MS ||
        now - session.createdAt >= MAX_SESSION_MS)
    ) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readStoredSession);
  const loading = false;
  const user = session?.user ?? null;

  useEffect(() => {
    if (!session || STAFF_ROLES.includes(session.user?.role)) return undefined;

    let lastActivityAt = session.lastActivityAt;
    let lastPersistedAt = session.lastActivityAt;

    const expireSession = () => {
      sessionStorage.removeItem(SESSION_KEY);
      setSession(null);
    };

    const isExpired = () => {
      const now = Date.now();
      if (
        now - lastActivityAt >= IDLE_TIMEOUT_MS ||
        now - session.createdAt >= MAX_SESSION_MS
      ) {
        expireSession();
        return true;
      }
      return false;
    };

    const persistActivity = () => {
      if (lastActivityAt <= lastPersistedAt) return;
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...session, lastActivityAt }),
      );
      lastPersistedAt = lastActivityAt;
    };

    const handleActivity = () => {
      if (isExpired()) return;
      lastActivityAt = Date.now();
      if (lastActivityAt - lastPersistedAt >= ACTIVITY_PERSIST_INTERVAL_MS) {
        persistActivity();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistActivity();
        return;
      }
      handleActivity();
    };

    const sessionTimer = window.setInterval(() => {
      if (!isExpired()) persistActivity();
    }, 15 * 1000);

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("scroll", handleActivity, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(sessionTimer);
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  const loginAction = async (u, p) => {
    const userData = await api.login(u, p);
    const now = Date.now();
    const nextSession = {
      user: userData,
      createdAt: now,
      lastActivityAt: now,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const logoutAction = () => {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, login: loginAction, logout: logoutAction, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
