import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Download, ExternalLink, Tag, Calendar, User,
  GitBranch, Package, Puzzle, Boxes, ChevronRight,
} from "lucide-react";
import { getGenerator, fetchGithubReadme, fetchGeneratorJson } from "@/lib/api";
import { CopyCommand } from "@/components/generators/copy-command";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const gen = await getGenerator(slug.join("/"));
    return { title: gen.name, description: gen.description ?? `xo generator: ${gen.name}` };
  } catch {
    return { title: "Generator not found" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function GeneratorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const name = slug.join("/");

  let generator;
  try {
    generator = await getGenerator(name);
  } catch {
    notFound();
  }

  const isProject = generator.type === "Project";

  const [readme, genJson] = await Promise.all([
    fetchGithubReadme(generator.githubUrl),
    fetchGeneratorJson(generator.githubUrl),
  ]);

  const command = isProject ? `xo create ${generator.name}` : `xo add ${generator.name}`;

  return (
    <div className="min-h-screen">
      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <div className="relative border-b border-border/60 bg-background">
        <div
          className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_90%_70%_at_50%_0%,#000_55%,transparent_100%)]"
          style={{
            backgroundImage: `linear-gradient(to right,hsl(var(--foreground)/0.04) 1px,transparent 1px),linear-gradient(to bottom,hsl(var(--foreground)/0.04) 1px,transparent 1px)`,
            backgroundSize: "3rem 3rem",
          }}
        />
        <div
          className={cn(
            "absolute inset-0",
            isProject
              ? "bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.07),transparent_50%)]"
              : "bg-[radial-gradient(ellipse_at_top,hsl(262_83%_58%/0.07),transparent_50%)]",
          )}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/generators" className="hover:text-foreground transition-colors">
              Generators
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-mono text-foreground">{generator.name}</span>
          </nav>

          <div className="flex flex-wrap items-start gap-5">
            {/* Icon */}
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm",
                isProject
                  ? "border-primary/25 bg-primary/10 text-primary shadow-primary/10"
                  : "border-violet-500/25 bg-violet-500/10 text-violet-500 shadow-violet-500/10",
              )}
            >
              {isProject ? <Boxes className="h-7 w-7" /> : <Puzzle className="h-7 w-7" />}
            </div>

            {/* Title block */}
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-2xl font-bold break-all">{generator.name}</h1>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                    isProject
                      ? "bg-primary/10 text-primary"
                      : "bg-violet-500/10 text-violet-500",
                  )}
                >
                  {generator.type}
                </span>
              </div>
              {generator.description && (
                <p className="text-base text-muted-foreground leading-relaxed">{generator.description}</p>
              )}
            </div>

            {/* GitHub button */}
            <Link
              href={generator.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <GitBranch className="h-4 w-4" />
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Quick stats strip */}
          <div className="mt-8 flex flex-wrap gap-6 border-t border-border/60 pt-6 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Download className="h-4 w-4" />
              <strong className="font-semibold text-foreground">{generator.downloads.toLocaleString()}</strong> downloads
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              by{" "}
              {generator.author.githubUrl ? (
                <Link href={generator.author.githubUrl} target="_blank" rel="noopener noreferrer"
                  className={cn("font-semibold transition-colors", isProject ? "text-primary hover:text-primary/80" : "text-violet-500 hover:text-violet-400")}>
                  {generator.author.name ?? "Unknown"}
                </Link>
              ) : (
                <strong className="font-semibold text-foreground">{generator.author.name ?? "Unknown"}</strong>
              )}
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Published <strong className="font-semibold text-foreground">{formatDate(generator.createdAt)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex gap-8 flex-col lg:flex-row">

          {/* README */}
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {/* README header */}
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">README</span>
              </div>
              <div className="p-6 sm:p-8">
                {readme ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:font-semibold prose-headings:scroll-mt-20
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-code:text-sky-400 prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-700/50 prose-pre:rounded-lg
                    prose-img:rounded-lg prose-hr:border-border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <GitBranch className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No README found</p>
                    <p className="text-xs text-muted-foreground">This generator doesn't have a README in its GitHub repository.</p>
                    <Link href={generator.githubUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-1 text-xs text-primary hover:underline">
                      View on GitHub →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-4">

            {/* Install command */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div
                className={cn(
                  "px-5 py-3 text-xs font-semibold uppercase tracking-wider",
                  isProject ? "bg-primary/5 text-primary" : "bg-violet-500/5 text-violet-500",
                )}
              >
                {isProject ? "Create project" : "Add to project"}
              </div>
              <div className="p-4">
                <CopyCommand command={command} />
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                  {isProject
                    ? "Scaffolds a new project in the current directory."
                    : "Applies this feature to your existing project."}
                </p>
              </div>
            </div>

            {/* Tags */}
            {generator.tags.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {generator.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/generators?search=${encodeURIComponent(tag)}`}
                      className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {genJson && (genJson.requires?.length || genJson.conflicts?.length) ? (
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dependencies</p>
                {genJson.requires && genJson.requires.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Package className="h-3.5 w-3.5" /> Requires
                    </p>
                    <div className="space-y-1">
                      {genJson.requires.map((dep) => (
                        <Link key={dep} href={`/generators/${dep}`}
                          className="block rounded-md bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {dep}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {genJson.conflicts && genJson.conflicts.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <Puzzle className="h-3.5 w-3.5" /> Conflicts with
                    </p>
                    <div className="space-y-1">
                      {genJson.conflicts.map((dep) => (
                        <span key={dep}
                          className="block rounded-md bg-destructive/10 px-3 py-1.5 font-mono text-xs text-destructive">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
