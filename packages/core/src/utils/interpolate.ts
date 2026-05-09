export function interpolate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const val = key.trim().split('.').reduce((o: unknown, k: string) => {
      if (o !== null && typeof o === 'object') return (o as Record<string, unknown>)[k];
      return undefined;
    }, ctx as unknown);
    return val !== undefined && val !== null ? String(val) : match;
  });
}
