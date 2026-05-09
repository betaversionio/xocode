import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Width/height in pixels. Defaults to 32. */
  size?: number;
}

/**
 * SVG logo that adapts to light/dark theme via CSS filter.
 * Black in light mode → white in dark mode, matching `currentColor` pattern.
 */
export function Logo({ className, size = 32 }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="xo"
      width={size}
      height={size}
      className={cn(
        "select-none",
        "dark:invert",
        className,
      )}
      aria-hidden="true"
    />
  );
}
