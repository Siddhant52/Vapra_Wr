import { ClerkAuthShell } from "@/components/clerk-auth-shell";

export default function AuthLayout({ children }) {
  return (
    <ClerkAuthShell>
      <div className="flex justify-center pt-40">{children}</div>
    </ClerkAuthShell>
  );
}
