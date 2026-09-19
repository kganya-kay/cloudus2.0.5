import Link from "next/link";
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

import { Hint } from "./hint";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const buttonStyles = {
  primary:
    "bg-os-fg text-os-bg hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-zinc-950",
  secondary:
    "border border-os-border bg-os-card text-os-fg hover:bg-os-elevated disabled:opacity-50",
  ghost: "text-os-muted hover:bg-os-elevated hover:text-os-fg disabled:opacity-50",
  danger: "bg-os-danger text-white hover:opacity-90 disabled:opacity-50",
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const styles = cx(
    "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none",
    size === "sm" ? "min-h-10 px-3.5 text-xs" : "min-h-11 px-4 text-sm",
    buttonStyles[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("os-card p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const tones = {
    default: "bg-os-gold/15 text-os-ink",
    accent: "bg-os-soft text-os-accent",
    success: "bg-os-forest/10 text-os-forest",
    warning: "bg-os-ochre/15 text-os-ochre",
  };
  return (
    <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const fallback = (name ?? "C").slice(0, 1).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Cloudus member"}
        className={cx(dim, "rounded-full object-cover")}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cx(
        dim,
        "inline-flex items-center justify-center rounded-full bg-os-soft text-sm font-semibold text-os-accent",
      )}
    >
      {fallback}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  hint,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  hint?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-2">
        <div className="space-y-2">
          {eyebrow ? <p className="os-kicker">{eyebrow}</p> : null}
          <h1 className="os-title">{title}</h1>
        </div>
        {hint ? <Hint>{hint}</Hint> : description ? <Hint>{description}</Hint> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="os-card h-36 overflow-hidden">
          <div className="skeleton h-full w-full" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="os-card flex flex-col items-start gap-3 p-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description ? <Hint>{description}</Hint> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Failed",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="os-card border-os-danger/30 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="os-muted mt-2">{description}</p> : null}
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div
      role="status"
      className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-os-warning"
    >
      Offline.
    </div>
  );
}
