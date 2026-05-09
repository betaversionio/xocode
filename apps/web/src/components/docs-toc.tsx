"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  label: string;
  depth: number;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function DocsToc() {
  const pathname = usePathname();
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Re-extract headings whenever the route changes
  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(article.querySelectorAll("h2, h3"));
    if (headings.length === 0) { setItems([]); return; }

    const extracted: TocItem[] = headings.map((el) => {
      const text = el.textContent ?? "";
      const id = el.id || slugify(text);
      if (!el.id) el.id = id;
      return { id, label: text, depth: Number(el.tagName[1]) };
    });

    setItems(extracted);
    setActiveId(extracted[0]?.id ?? "");
  }, [pathname]);

  // IntersectionObserver to track active heading
  useEffect(() => {
    if (items.length === 0) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // pick the topmost visible heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0]!.target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const displayId = hoveredId || activeId;

  return (
    <aside className="hidden xl:block w-52 shrink-0">
      <nav className="sticky top-24 space-y-1">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId("")}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "block truncate rounded-md py-1 text-sm transition-colors",
              item.depth === 3 ? "pl-5" : "pl-2",
              displayId === item.id
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
