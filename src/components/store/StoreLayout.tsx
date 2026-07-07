import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StoreHeader } from "./StoreHeader";
import { StoreFooter } from "./StoreFooter";
import { settingsQuery } from "@/lib/store";

export function StoreLayout({ children }: { children: ReactNode }) {
  const { data: settings } = useQuery(settingsQuery());
  const ann = settings?.announcement;

  return (
    <div className="flex min-h-screen flex-col">
      {ann?.enabled && ann.text && (
        <div className="bg-gradient-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
          {ann.text}
        </div>
      )}
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
