import Header from "@/components/header";
import { HeaderAuthServer } from "@/components/header-auth-server";

export function HeaderShell() {
  return <Header authSlot={<HeaderAuthServer />} />;
}
