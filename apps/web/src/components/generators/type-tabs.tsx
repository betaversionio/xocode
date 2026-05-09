"use client";

import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { generatorSearchParams } from "@/lib/search-params";

const TABS = [
  { value: "",        label: "All" },
  { value: "Project", label: "Project scaffolds" },
  { value: "Feature", label: "Feature generators" },
] as const;

export function TypeTabs() {
  const [type, setType] = useQueryState("type", generatorSearchParams.type);

  return (
    <div className="flex gap-1 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setType(tab.value || null)}
          className={cn(
            "rounded-full px-3.5 py-1 text-sm font-medium transition-colors",
            (type ?? "") === tab.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
