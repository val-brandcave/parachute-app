import { cn } from "@/lib/utils";

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("ui-input", className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("ui-textarea", className)} {...rest} />;
}

export function Label({
  className,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("ui-label", className)} {...rest} />;
}
