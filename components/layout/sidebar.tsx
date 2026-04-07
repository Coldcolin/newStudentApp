"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  UserCheck,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useAppDispatch,
  useSidebarOpen,
  useCurrentUser,
} from "@/lib/store/hooks";
import { setSidebarOpen } from "@/lib/store/slices/uiSlice";
import { clearCredentials } from "@/lib/store/slices/authSlice";
import { toast } from "sonner";
import { useEffect } from "react";
import Image from "next/image";

// Navigation items - filtered by role
const getNavigation = (role?: string) => {
  const baseNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/profile", icon: FileText },
    { name: "Attendance", href: "/checkin", icon: UserCheck },
    { name: "Assessment", href: "/assessments", icon: GraduationCap },
    { name: "Rankings", href: "/rankings", icon: Trophy },
  ];

  // Admin-only items
  if (role === "admin") {
    baseNav.push({ name: "All Students", href: "/students", icon: Users });
  }

  return baseNav;
};

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isSidebarOpen = useSidebarOpen();
  const user = useCurrentUser();

  // Get navigation based on user role
  const navigation = getNavigation(user?.role);

  const handleLogout = () => {
    dispatch(clearCredentials());
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const closeSidebar = () => {
    dispatch(setSidebarOpen(false));
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSidebar();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-20 items-center justify-start border-sidebar-border px-6 mt-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 justify-start"
        >
          <div className="flex items-center justify-start">
            <Image
              src="/theCurveLogo.png"
              alt="The Curve"
              width={200}
              height={100}
              priority
              style={{ width: "auto", height: "auto" }}
            />
          </div>
        </Link>
        {/* Close button - only on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Navigation */}
      <nav
        className="flex-1 space-y-2 px-4 py-6"
        role="navigation"
        aria-label="Main navigation"
      >
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-[#ffb703]"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-[#ffb703]" : "text-muted-foreground",
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-sidebar-border px-4 py-4">
        {/* {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-[#ffb703]"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-[#ffb703]" : "text-muted-foreground",
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })} */}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#ec1c24] transition-colors hover:bg-[#ec1c24]/10"
          aria-label="Log out of your account"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible on md+, fixed position */}
      <aside
        className="hidden fixed left-0 top-0 h-screen w-[250px] flex-col border-r border-sidebar-border bg-sidebar md:flex overflow-y-auto"
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* Spacer for fixed sidebar on desktop */}
      <div className="hidden md:block w-[250px] shrink-0" />

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden",
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:hidden",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Mobile sidebar navigation"
        aria-hidden={!isSidebarOpen}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// Mobile sidebar toggle (hamburger menu)
export function MobileSidebarToggle() {
  const dispatch = useAppDispatch();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 md:hidden"
      onClick={() => dispatch(setSidebarOpen(true))}
      aria-label="Open navigation menu"
      aria-expanded="false"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
}
