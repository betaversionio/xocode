"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Overview",
    links: [
      { href: "/docs/getting-started", label: "Getting Started" },
    ],
  },
  {
    title: "Building Generators",
    links: [
      { href: "/docs/creating-generators", label: "Creating a Generator" },
      { href: "/docs/workflows", label: "Workflow Reference" },
      { href: "/docs/actions", label: "Actions Reference" },
      { href: "/docs/signals", label: "Signals Reference" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/docs/cli-reference", label: "CLI Reference" },
      { href: "/docs/config", label: "Config Reference" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0">
      <nav className="sticky top-20 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
