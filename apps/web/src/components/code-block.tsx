"use client";

import { cn } from "@/lib/utils";

// ─── JSON syntax highlighter ────────────────────────────────────────────────

type TokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "plain";

interface Token { type: TokenType; value: string }

function tokenizeJson(raw: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const ch = () => raw[i] ?? "";

  while (i < raw.length) {
    // whitespace
    if (/\s/.test(ch())) {
      let ws = "";
      while (i < raw.length && /\s/.test(raw[i] ?? "")) ws += raw[i++];
      tokens.push({ type: "plain", value: ws });
      continue;
    }

    // string
    if (ch() === '"') {
      let str = '"';
      i++;
      while (i < raw.length) {
        const c = raw[i] ?? "";
        if (c === "\\") { str += c + (raw[i + 1] ?? ""); i += 2; continue; }
        str += c; i++;
        if (c === '"') break;
      }
      // look ahead to detect key vs value
      let j = i;
      while (j < raw.length && /[ \t]/.test(raw[j] ?? "")) j++;
      tokens.push({ type: raw[j] === ":" ? "key" : "string", value: str });
      continue;
    }

    // number
    if (/[-\d]/.test(ch())) {
      let num = "";
      while (i < raw.length && /[-\d.eE+]/.test(raw[i] ?? "")) num += raw[i++];
      tokens.push({ type: "number", value: num });
      continue;
    }

    // keywords
    if (raw.startsWith("true",  i)) { tokens.push({ type: "boolean", value: "true"  }); i += 4; continue; }
    if (raw.startsWith("false", i)) { tokens.push({ type: "boolean", value: "false" }); i += 5; continue; }
    if (raw.startsWith("null",  i)) { tokens.push({ type: "null",    value: "null"  }); i += 4; continue; }

    // punctuation
    if ("{}[],:".includes(ch())) { tokens.push({ type: "punctuation", value: ch() }); i++; continue; }

    tokens.push({ type: "plain", value: ch() }); i++;
  }

  return tokens;
}

// ─── Shell highlighter ───────────────────────────────────────────────────────

function tokenizeSh(raw: string): Token[] {
  return raw.split("\n").flatMap((line, idx, arr) => {
    const toks: Token[] = [];
    const flagRe = /(--?[\w-]+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = flagRe.exec(line)) !== null) {
      const match = m[1] ?? "";
      if (m.index > last) toks.push({ type: "plain", value: line.slice(last, m.index) });
      toks.push({ type: "punctuation", value: match });
      last = m.index + match.length;
    }
    if (last < line.length) toks.push({ type: "plain", value: line.slice(last) });
    if (idx < arr.length - 1) toks.push({ type: "plain", value: "\n" });
    return toks;
  });
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

function highlight(code: string, lang?: string): Token[] {
  if (!lang || lang === "json") {
    try { JSON.parse(code.trim()); return tokenizeJson(code); } catch { /* ok */ }
    if (/^\s*[{[]/.test(code.trim())) return tokenizeJson(code);
  }
  if (lang === "sh" || lang === "bash" || lang === "shell") return tokenizeSh(code);
  return [{ type: "plain", value: code }];
}

const tokenClass: Record<TokenType, string> = {
  key:         "text-sky-400",
  string:      "text-emerald-400",
  number:      "text-amber-400",
  boolean:     "text-violet-400",
  null:        "text-zinc-500",
  punctuation: "text-zinc-400",
  plain:       "text-zinc-300",
};

function HighlightedCode({ code, lang }: { code: string; lang?: string }) {
  const tokens = highlight(code.trim(), lang);
  return (
    <>
      {tokens.map((tok, i) => (
        <span key={i} className={tokenClass[tok.type]}>{tok.value}</span>
      ))}
    </>
  );
}

// ─── Public components ────────────────────────────────────────────────────────

interface CodeBlockProps {
  code: string;
  lang?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, lang, filename, className }: CodeBlockProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-950", className)}>
      {filename && (
        <div className="flex items-center gap-2 border-b border-zinc-700/50 bg-zinc-900 px-4 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs text-zinc-400">{filename}</span>
          {lang && <span className="ml-auto text-xs text-zinc-600">{lang}</span>}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="block">
          <HighlightedCode code={code} lang={lang} />
        </code>
      </pre>
    </div>
  );
}

interface TerminalBlockProps {
  commands: string | string[];
  className?: string;
}

export function TerminalBlock({ commands, className }: TerminalBlockProps) {
  const lines = Array.isArray(commands) ? commands : [commands];
  return (
    <div className={cn("overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-950", className)}>
      <div className="flex items-center gap-2 border-b border-zinc-700/50 bg-zinc-900 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-400">terminal</span>
      </div>
      <pre className="p-4 text-sm leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <span className="select-none text-zinc-600">$</span>
            <span className="text-zinc-200">
              <HighlightedCode code={line} lang="sh" />
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}
