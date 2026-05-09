import type { Metadata } from "next";
import Link from "next/link";
import { Download, GitBranch, Tag, Boxes, Puzzle, SearchX } from "lucide-react";
import type { SearchParams } from "nuqs/server";
import { listGenerators, type Generator } from "@/lib/api";
import { generatorParamsCache } from "@/lib/search-params";
import { GeneratorSearchBar } from "@/components/generators/search-bar";
import { TypeTabs } from "@/components/generators/type-tabs";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Generators" };

const PER_PAGE = 24;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function GeneratorCard({ gen }: { gen: Generator }) {
  const isProject = gen.type === "Project";

  return (
    <Link
      href={`/generators/${gen.name}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30"
    >
      {/* Type accent bar */}
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] transition-opacity duration-200",
          isProject
            ? "bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 group-hover:opacity-100"
            : "bg-gradient-to-r from-violet-500/60 via-violet-500 to-violet-500/60 opacity-0 group-hover:opacity-100",
        )}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            isProject
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-violet-500/20 bg-violet-500/10 text-violet-500",
          )}
        >
          {isProject
            ? <Boxes className="h-4 w-4" />
            : <Puzzle className="h-4 w-4" />
          }
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
              {gen.name}
            </span>
          </div>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-widest",
              isProject ? "text-primary/70" : "text-violet-500/70",
            )}
          >
            {gen.type}
          </span>
        </div>
      </div>

      {/* Description */}
      {gen.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {gen.description}
        </p>
      )}

      {/* Tags */}
      {gen.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {gen.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {gen.tags.length > 4 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              +{gen.tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Download className="h-3 w-3" />
          {gen.downloads.toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3" />
          {gen.author.name ?? gen.author.id.slice(0, 8)}
        </span>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ search }: { search?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-base font-medium">No generators found</p>
      <p className="text-sm text-muted-foreground">
        {search ? `No results for "${search}". Try a different search term.` : "No generators match the current filter."}
      </p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return (
    <div className="col-span-full flex items-center justify-center gap-2 pt-10">
      {page > 1 && (
        <Link
          href={`?page=${page - 1}`}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Previous
        </Link>
      )}
      <span className="px-4 text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages && (
        <Link
          href={`?page=${page + 1}`}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Next
        </Link>
      )}
    </div>
  );
}

// ─── List (server, fetches API) ───────────────────────────────────────────────

async function GeneratorList() {
  const { search, type, page } = generatorParamsCache.all();

  let result;
  try {
    result = await listGenerators({ search: search || undefined, page, limit: PER_PAGE });
  } catch {
    return (
      <div className="col-span-full flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm text-muted-foreground">Could not reach the API. Make sure the server is running.</p>
      </div>
    );
  }

  const filtered = type ? result.data.filter((g) => g.type === type) : result.data;
  if (filtered.length === 0) return <EmptyState search={search} />;

  return (
    <>
      <p className="col-span-full text-xs text-muted-foreground">
        {result.total.toLocaleString()} generator{result.total !== 1 ? "s" : ""}
        {search ? ` matching "${search}"` : ""}
      </p>
      {filtered.map((gen) => <GeneratorCard key={gen.id} gen={gen} />)}
      <Pagination page={result.page} totalPages={result.totalPages} />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GeneratorsPage({ searchParams }: PageProps) {
  await generatorParamsCache.parse(searchParams);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative border-b border-border/60 bg-background">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)]"
          style={{
            backgroundImage: `linear-gradient(to right,hsl(var(--foreground)/0.04) 1px,transparent 1px),linear-gradient(to bottom,hsl(var(--foreground)/0.04) 1px,transparent 1px)`,
            backgroundSize: "3rem 3rem",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Registry</p>
              <h1 className="text-4xl font-bold tracking-tight">Generators</h1>
              <p className="mt-2 max-w-lg text-base text-muted-foreground">
                Scaffold projects and add features with composable, declarative generators.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex shrink-0 gap-6 text-right">
              <div>
                <p className="text-2xl font-bold tabular-nums">10</p>
                <p className="text-xs text-muted-foreground">Project scaffolds</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-2xl font-bold tabular-nums">14</p>
                <p className="text-xs text-muted-foreground">Feature generators</p>
              </div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Suspense>
                <GeneratorSearchBar />
              </Suspense>
            </div>
            <Suspense>
              <TypeTabs />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense
            fallback={Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
            ))}
          >
            <GeneratorList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
