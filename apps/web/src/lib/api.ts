const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api`;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeneratorAuthor {
  id: string;
  name: string | null;
  githubUrl: string | null;
}

export interface Generator {
  id: string;
  name: string;
  type: "Project" | "Feature";
  githubUrl: string;
  description: string | null;
  tags: string[];
  downloads: number;
  authorId: string;
  author: GeneratorAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratorList {
  data: Generator[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Generator endpoints ──────────────────────────────────────────────────────

export async function listGenerators(params: {
  page?: number;
  limit?: number;
  search?: string;
  order?: "asc" | "desc";
} = {}): Promise<GeneratorList> {
  const url = new URL(`${API_BASE}/generators`);
  if (params.page)   url.searchParams.set("page",  String(params.page));
  if (params.limit)  url.searchParams.set("limit", String(params.limit));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.order)  url.searchParams.set("order",  params.order);

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to fetch generators");
  return res.json() as Promise<GeneratorList>;
}

export async function getGenerator(name: string): Promise<Generator> {
  const res = await fetch(`${API_BASE}/generators/${name}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) throw new Error(`Generator "${name}" not found`);
  if (!res.ok) throw new Error("Failed to fetch generator");
  return res.json() as Promise<Generator>;
}

// ─── GitHub helpers ───────────────────────────────────────────────────────────

function parseGithubUrl(githubUrl: string): { owner: string; repo: string } | null {
  try {
    const { pathname } = new URL(githubUrl);
    const parts = pathname.replace(/^\//, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0]!, repo: parts[1]! };
  } catch {
    return null;
  }
}

export async function fetchGithubReadme(githubUrl: string): Promise<string | null> {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) return null;
  try {
    const raw = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/HEAD/README.md`;
    const res = await fetch(raw, { next: { revalidate: 3600 } });
    return res.ok ? res.text() : null;
  } catch {
    return null;
  }
}

export interface GeneratorJson {
  name?: string;
  type?: string;
  requires?: string[];
  conflicts?: string[];
  detects?: unknown[];
  prompts?: unknown[];
  actions?: unknown[];
}

export async function fetchGeneratorJson(githubUrl: string): Promise<GeneratorJson | null> {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) return null;
  try {
    const raw = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/HEAD/generator.json`;
    const res = await fetch(raw, { next: { revalidate: 3600 } });
    return res.ok ? (res.json() as Promise<GeneratorJson>) : null;
  } catch {
    return null;
  }
}
