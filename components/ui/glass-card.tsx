import { clsx } from "clsx";

export function GlassCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={clsx("glass-panel rounded-xl", className)}>{children}</section>;
}
