import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";

type CalloutVariant = "info" | "warning" | "tip" | "success";

const variants: Record<CalloutVariant, { icon: React.ElementType; className: string; iconClass: string }> = {
  info: {
    icon: Info,
    className: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20",
    iconClass: "text-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-950/20",
    iconClass: "text-yellow-500",
  },
  tip: {
    icon: Lightbulb,
    className: "border-primary/20 bg-primary/5 dark:border-primary/20 dark:bg-primary/10",
    iconClass: "text-primary",
  },
  success: {
    icon: CheckCircle,
    className: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    iconClass: "text-emerald-500",
  },
};

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const { icon: Icon, className, iconClass } = variants[variant];
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4", className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
      <div className="text-sm leading-relaxed">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
