"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/search", label: "Search" },
  { href: "/groups", label: "Groups" },
  { href: "/pages", label: "Pages" },
  { href: "/messages", label: "Messages" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-brand-light/80 dark:bg-brand-dark/80 border-b border-brand-borderLight dark:border-brand-borderDark">
      <div className="max-w-feed mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="font-extrabold text-lg tracking-tight text-brand-accent">
          DeshiFeed
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-brand-accent"
                  : "text-gray-600 dark:text-gray-300 hover:text-brand-accent transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                href={`/profile/${user.uid}`}
                className="text-sm font-medium hidden sm:inline hover:text-brand-accent transition-colors"
              >
                {profile?.displayName || "Profile"}
              </Link>
              <button onClick={signOut} className="btn-secondary text-sm py-1.5">
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => router.push("/login")} className="btn-primary text-sm py-1.5">
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* mobile nav */}
      <nav className="sm:hidden flex items-center justify-around border-t border-brand-borderLight dark:border-brand-borderDark text-xs font-medium py-1.5">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "text-brand-accent" : "text-gray-500 dark:text-gray-400"}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
