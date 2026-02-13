"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "https://api.serviceengine.xyz";

interface System {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface User {
  user_id: string;
  email: string;
  name: string;
  systems: System[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("ea_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/public/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const userData = await response.json();
      localStorage.setItem("ea_user", JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("ea_user");
    setUser(null);
    setEmail("");
    setPassword("");
  };

  const handleSystemClick = (slug: string) => {
    router.push(`/chat/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold text-center mb-8">my.ea.systems</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full p-4 mb-4 bg-neutral-900 border border-neutral-800 rounded text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full p-4 mb-4 bg-neutral-900 border border-neutral-800 rounded text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
            {error && <p className="text-red-400 mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full p-4 bg-white text-black rounded font-medium hover:bg-neutral-200 disabled:bg-neutral-600 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard with sidebar
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col p-4">
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 mb-4 cursor-pointer hover:opacity-80"
        >
          <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center font-semibold">
            E
          </div>
          <span className="font-semibold text-sm">Everything Automation</span>
        </div>

        <nav className="flex-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded bg-neutral-900 text-white mb-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </div>

          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide px-3 mt-6 mb-2">
            Workspace
          </p>
          <div className="flex items-center gap-3 px-3 py-2 rounded text-neutral-500 hover:bg-neutral-900 hover:text-white cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Systems
          </div>

          <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-wide px-3 mt-6 mb-2">
            Account
          </p>
          <div className="flex items-center gap-3 px-3 py-2 rounded text-neutral-500 hover:bg-neutral-900 hover:text-white cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            Billing
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded text-neutral-500 hover:bg-neutral-900 hover:text-white cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </div>
        </nav>

        <div className="border-t border-neutral-900 pt-4 mt-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded text-neutral-500 hover:bg-neutral-900 hover:text-white cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            Help & Support
          </div>
          <p className="text-xs text-neutral-600 px-3 mt-2">team@everythingautomation.com</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
          <p className="text-neutral-500">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.systems.map((system) => (
            <div
              key={system.id}
              onClick={() => handleSystemClick(system.slug)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 cursor-pointer hover:border-neutral-700 hover:bg-neutral-800/50 transition-colors"
            >
              <h3 className="font-medium mb-1">{system.name}</h3>
              <p className="text-sm text-neutral-500">{system.description || ""}</p>
            </div>
          ))}
          {user.systems.length === 0 && (
            <p className="text-neutral-500">No systems available</p>
          )}
        </div>
      </main>
    </div>
  );
}
