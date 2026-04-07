"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useIsAuthenticated } from "@/lib/store/hooks";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration to complete before checking auth
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  // Show loading spinner while hydrating or checking auth
  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ffb703] border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - handled internally with mobile drawer */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 py-4 px-4 md:py-6 md:px-10">{children}</main>
      </div>
    </div>
  );
}
