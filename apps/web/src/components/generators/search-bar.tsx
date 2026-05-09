"use client";

import { useQueryState } from "nuqs";
import { Search } from "lucide-react";
import { generatorSearchParams } from "@/lib/search-params";

export function GeneratorSearchBar() {
  const [search, setSearch] = useQueryState("search", generatorSearchParams.search);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        value={search ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          setSearch(v.trim() || null);
        }}
        placeholder="Search generators…"
        className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring transition"
      />
    </div>
  );
}
