import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-lime text-ink hover:bg-lime-deep",
        secondary: "border-2 border-ink/15 bg-card text-ink hover:border-ink",
        ghost: "bg-transparent text-ink hover:bg-white",
        danger: "bg-ink text-paper hover:bg-black",
      },
      size: {
        md: "min-h-12 px-5 text-base",
        xl: "min-h-14 w-full px-6 text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  size: "md" | "xl" = "md",
  className?: string,
) {
  return cn(buttonVariants({ variant, size }), className);
}

export function Button({ className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant ?? "primary", size ?? "md", className)} {...props} />;
}
