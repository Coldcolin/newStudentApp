"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser, useAppDispatch } from "@/lib/store/hooks";
import { clearCredentials } from "@/lib/store/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileSidebarToggle } from "./sidebar";
import { toast } from "sonner";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const user = useCurrentUser();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(clearCredentials());
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-transparent px-4 md:px-6 bg-white">
      {/* Hamburger menu - left side on mobile */}
      <div className="flex items-center">
        <MobileSidebarToggle />
      </div>

      {/* User Profile - Right Aligned */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 px-2 hover:bg-transparent"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    user?.avatar ||
                    "/placeholder.svg?height=40&width=40&query=professional%20woman"
                  }
                />
                <AvatarFallback className="bg-[#ffb703] text-[#08022b]">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-semibold text-foreground">
                  {user?.firstName || "Chiamaka"} {user?.lastName || "Dubem"}
                </span>
                <span className="text-xs text-[#219ebc]">
                  {user?.role === "admin"
                    ? "Frontend Designer"
                    : user?.role || "Frontend Designer"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#ec1c24] focus:text-[#ec1c24]"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
