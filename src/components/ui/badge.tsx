import { cn } from "@/lib/cn";

const tones = {
  sample: "bg-sand text-ink",
  lime: "bg-lime text-ink",
  quiet: "bg-white text-muted border border-line",
  caution: "bg-caution-bg text-caution",
  ink: "bg-ink text-paper",
};

export function Badge({
  tone = "quiet",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full px-2.5 text-sm font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
