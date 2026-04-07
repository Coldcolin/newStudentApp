"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useIsAuthenticated } from "@/lib/store/hooks";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isHydrated, router]);

  // Show loading while checking auth
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ffb703] border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if authenticated
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ffb703] border-t-transparent" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Image */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/AuthImage.png"
          alt="Student with books"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg">
            <Image
              src="/theCurveLogo.png"
              alt="Curve Academy"
              width={200}
              height={200}
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-[#08022b]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full items-center justify-center bg-card px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffb703]">
              <span className="text-lg font-bold text-[#08022b]">CA</span>
            </div>
            <span className="text-2xl font-semibold text-foreground">
              Curve Academy
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
