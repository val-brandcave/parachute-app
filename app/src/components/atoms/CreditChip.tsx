import { cn } from "@/lib/utils";

/**
 * Credits-and-money chip (variants board, row 2, option 2 — "tinted by meaning").
 *
 * Use a chip for a STANDALONE quantity, price or status. Keep plain text when the
 * number sits inside a sentence, for hero figures and inside table cells.
 * Legends are never chips: a legend is a swatch + plain text.
 *
 * credit  navy tint      a credit amount ("2 credits", "13 credits")
 * trial   dashed outline trial credits ("6 trial credits")
 * money   neutral        a dollar amount ("~$300", "$1,400")
 * free    green          free / earned ("Free", "+1 credit")
 * low     amber          low balance, or something waiting ("Low", "Pending")
 */
export type CreditChipTone = "credit" | "trial" | "money" | "free" | "low";

export function CreditChip({
  tone,
  size = "md",
  className,
  children,
}: {
  tone: CreditChipTone;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("cchip", `cchip--${tone}`, size === "sm" && "cchip--sm", className)}>{children}</span>;
}
