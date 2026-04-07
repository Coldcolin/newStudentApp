"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAuthLoading, useAuthError } from "@/lib/store/hooks";
import { loginUser, clearError, setCredentials } from "@/lib/store/slices/authSlice";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAuthLoading();
  const authError = useAuthError();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "student">("admin");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError());

    // For demo purposes, simulate a successful login
    // In production, this would call the actual API
    try {
      // Simulated demo login - role based on selection
      const demoUser = {
        id: "1",
        email: data.email,
        firstName: selectedRole === "admin" ? "Helen" : "Chiamaka",
        lastName: selectedRole === "admin" ? "Anderson" : "Dubem",
        role: selectedRole,
        avatar: "/placeholder.svg?height=100&width=100&query=woman%20professional",
      };

      dispatch(
        setCredentials({
          user: demoUser,
          token: "demo-token-123",
          refreshToken: "demo-refresh-token-456",
        })
      );

      toast.success("Login successful!");
      router.push("/dashboard");
    } catch {
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Login"
      subtitle="Welcome back! Please enter your credentials."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Demo Role Selector */}
        <div className="rounded-lg border border-[#ffb703]/50 bg-[#ffb703]/10 p-4 space-y-3">
          <p className="text-sm font-medium text-[#08022b]">Demo Mode: Select Role</p>
          <Select value={selectedRole} onValueChange={(value: "admin" | "student") => setSelectedRole(value)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin (Full Access)</SelectItem>
              <SelectItem value="student">Student (Limited Access)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedRole === "admin" 
              ? "Admin can view all students, assessments, and attendance records"
              : "Student can only view their own profile and check-in for attendance"}
          </p>
        </div>

        {authError && (
          <div className="rounded-lg bg-[#ec1c24]/10 p-3 text-sm text-[#ec1c24]">
            {authError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className="h-11"
          />
          {errors.email && (
            <p className="text-sm text-[#ec1c24]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password")}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-[#ec1c24]">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="rememberMe" {...register("rememberMe")} />
            <Label htmlFor="rememberMe" className="text-sm font-normal">
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-[#ffb703] hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#ffb703] hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
