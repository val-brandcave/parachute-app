import { AppShell } from "@/components/templates/AppShell";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
