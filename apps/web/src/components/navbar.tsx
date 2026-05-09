"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Github } from "lucide-react";
import { Logo } from "@/components/logo";

const navLinks = [
  { href: "/docs/getting-started", label: "Docs" },
  { href: "/docs/cli-reference", label: "CLI" },
  { href: "/generators", label: "Generators" },
];

function ThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Moon className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Theme</TooltipContent>
    </Tooltip>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDocsActive = pathname.startsWith("/docs");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-200",
        scrolled || menuOpen
          ? "border-b border-border/60 bg-background/80 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Logo size={32} />
        </Link>

        <div className="hidden flex-1 items-center justify-start gap-1 pl-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground",
                (
                  link.href === "/docs/getting-started"
                    ? isDocsActive
                    : link.href === "/generators"
                    ? pathname.startsWith("/generators")
                    : pathname === link.href
                )
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href="https://github.com/betaversionio/xocode"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>GitHub</TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-border px-4 py-3 shadow-lg md:hidden bg-background/95 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-muted"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://github.com/betaversionio/xocode"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
