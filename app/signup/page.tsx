"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAppDispatch,
  useAuthLoading,
  useAuthError,
} from "@/lib/store/hooks";
import {
  registerUser,
  clearError,
  setCredentials,
} from "@/lib/store/slices/authSlice";
import { toast } from "sonner";

const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirmPassword: z.string(),
    role: z.enum(["student", "teacher"], {
      required_error: "Please select a role",
    }),
    hub: z.enum(["HQ", "Festac"]).optional(),
    course: z.enum(["Frontend", "Backend", "Product Design"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "student") {
        return data.hub !== undefined && data.course !== undefined;
      }
      return true;
    },
    {
      message: "Hub and course are required for students",
      path: ["hub"],
    },
  );

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isLoading = useAuthLoading();
  const authError = useAuthError();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role");

  const firstName = watch("firstName");
  const lastName = watch("lastName");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    dispatch(clearError());

    // For demo purposes, simulate a successful registration
    try {
      const demoUser = {
        id: "1",
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as "admin" | "teacher" | "student",
        hub: data.hub,
        course: data.course,
        avatar: avatarPreview || undefined,
      };

      dispatch(
        setCredentials({
          user: demoUser,
          token: "demo-token-123",
          refreshToken: "demo-refresh-token-456",
        }),
      );

      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <AuthLayout title="Sign Up" subtitle="Create your account to get started.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {authError && (
          <div className="rounded-lg bg-[#ec1c24]/10 p-3 text-sm text-[#ec1c24]">
            {authError}
          </div>
        )}

        {/* Avatar Upload */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-[#ffb703]">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="bg-[#f3f4f6] text-[#687182] text-xl">
                {firstName?.[0]}
                {lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] transition-colors"
            >
              <Upload className="h-4 w-4" />
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              {...register("firstName")}
              className="h-11"
            />
            {errors.firstName && (
              <p className="text-sm text-[#ec1c24]">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              {...register("lastName")}
              className="h-11"
            />
            {errors.lastName && (
              <p className="text-sm text-[#ec1c24]">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            {...register("email")}
            className="h-11"
          />
          {errors.email && (
            <p className="text-sm text-[#ec1c24]">{errors.email.message}</p>
          )}
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            onValueChange={(value) =>
              setValue("role", value as "student" | "teacher")
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-[#ec1c24]">{errors.role.message}</p>
          )}
        </div>

        {/* Hub Selection - Only for Students */}
        {selectedRole === "student" && (
          <div className="space-y-2">
            <Label htmlFor="hub">Hub</Label>
            <Select
              onValueChange={(value) =>
                setValue("hub", value as "HQ" | "Festac")
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select your hub" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HQ">HQ</SelectItem>
                <SelectItem value="Festac">Festac</SelectItem>
              </SelectContent>
            </Select>
            {errors.hub && (
              <p className="text-sm text-[#ec1c24]">{errors.hub.message}</p>
            )}
          </div>
        )}

        {/* Course Selection - Only for Students */}
        {selectedRole === "student" && (
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select
              onValueChange={(value) =>
                setValue(
                  "course",
                  value as "Frontend" | "Backend" | "Product Design",
                )
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select your course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Frontend">Frontend</SelectItem>
                <SelectItem value="Backend">Backend</SelectItem>
                <SelectItem value="Product Design">Product Design</SelectItem>
              </SelectContent>
            </Select>
            {errors.course && (
              <p className="text-sm text-[#ec1c24]">{errors.course.message}</p>
            )}
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              {...register("confirmPassword")}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-[#ec1c24]">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-[#ffb703] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
