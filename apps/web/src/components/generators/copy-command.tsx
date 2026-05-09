"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-700/50 bg-zinc-950 px-4 py-3 text-sm font-mono transition-colors hover:border-zinc-600",
        className,
      )}
    >
      <span className="truncate text-zinc-200">$ {command}</span>
      <span className="shrink-0 text-zinc-500 transition-colors group-hover:text-zinc-300">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
