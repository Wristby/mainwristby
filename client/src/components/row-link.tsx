import { Link } from "wouter";
import { cn } from "@/lib/utils";

/**
 * Full-row link overlay.
 *
 * Renders a real anchor stretched across the whole table row so the entire row
 * supports native browser behaviour: left click, middle click (new tab),
 * Ctrl/Cmd + click, and right click -> "Open link in new tab".
 *
 * Usage: place inside the first cell of a row that has `position: relative`
 * (Tailwind `relative`). Interactive controls in the same row must sit above
 * the overlay with `relative z-10`.
 */
export function RowLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("absolute inset-0 z-0", className)}
      data-testid={`link-row-${href.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
    >
      <span className="sr-only">{label}</span>
    </Link>
  );
}
