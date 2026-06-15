import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

export function IconButton({
  name,
  size = 18,
  onNavy,
  className,
  ...rest
}: {
  name: IconName;
  size?: number;
  onNavy?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("ui-iconbtn", onNavy && "ui-iconbtn--onnavy", className)}
      {...rest}
    >
      <Icon name={name} size={size} />
    </button>
  );
}
