export function evaluate(expr: string, ctx: Record<string, unknown>): boolean {
  try {
    const keys = Object.keys(ctx);
    const vals = Object.values(ctx);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(...keys, `"use strict"; return !!(${expr});`);
    return Boolean(fn(...vals));
  } catch {
    return false;
  }
}
