"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { IconButton } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <Image
            src="/logo-icon.png"
            alt="IdeaRadar"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
            IdeaRadar
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/leaderboard"
            className="text-sm text-text-muted transition-colors hover:text-accent"
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            className="text-sm text-text-muted transition-colors hover:text-accent"
          >
            About
          </Link>
          
          {/* Auth-aware navigation */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-text-muted transition-colors hover:text-accent">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
          
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm text-text-muted transition-colors hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Create Idea
            </Link>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </SignedIn>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <IconButton
            icon={
              mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )
            }
            label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container flex flex-col gap-4 py-4">
            <Link
              href="/leaderboard"
              className="text-sm text-text-muted transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/about"
              className="text-sm text-text-muted transition-colors hover:text-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            
            {/* Auth-aware mobile navigation */}
            <SignedOut>
              <SignInButton mode="modal">
                <button 
                  className="text-sm text-text-muted transition-colors hover:text-accent text-left"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button 
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm text-text-muted transition-colors hover:text-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/create"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Idea
              </Link>
              <div className="flex items-center gap-2">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
                <span className="text-sm text-text-muted">Account</span>
              </div>
            </SignedIn>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
