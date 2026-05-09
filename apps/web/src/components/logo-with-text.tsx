import Link from "next/link";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

interface LogoWithTextProps {
  href?: string;
  logoSize?: number;
  className?: string;
  showTagline?: boolean;
}

export function LogoWithText({
  href = "/",
  logoSize = 28,
  className,
  showTagline = true,
}: LogoWithTextProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 transition-opacity hover:opacity-80",
        className,
      )}
    >
      <Logo size={logoSize} />
      {/* {showTagline && (
        <span className="hidden text-sm font-medium text-muted-foreground sm:block">
          generator engine
        </span>
      )} */}
    </Link>
  );
}
