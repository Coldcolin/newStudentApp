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
  setLoading,
  setCredentials,
} from "@/lib/store/slices/authSlice";
import { toast } from "sonner";
import axiosInstance from "@/lib/api/axios";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirmPassword: z.string(),
    hub: z.enum(["hq", "festac"], {
      required_error: "Please select a hub",
    }),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),
    stack: z.enum(["frontend", "backend", "product design", "tutor"], {
      required_error: "Please select a stack/course",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

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
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const name = watch("name");
  // const lastName = watch("lastName");

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
    dispatch(setLoading(true));

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("hub", data.hub);
      formData.append("phone", data.phone);
      formData.append("stack", data.stack);

      // Append image if available
      const avatarFile = (document.getElementById("avatar") as HTMLInputElement)
        ?.files?.[0];
      if (avatarFile) {
        formData.append("image", avatarFile);
      }

      // Call the actual API endpoint using axios
      // Note: axios automatically sets Content-Type to multipart/form-data for FormData
      // withCredentials: false to avoid CORS wildcard conflict with credentials
      const response = await axiosInstance.post("/users/create", formData, {
        withCredentials: false,
      });

      const result = response.data;

      // Extract token from response (adapt based on actual API response structure)
      const { token, user } = result.data || result;

      // Store token and update auth state
      dispatch(
        setCredentials({
          user: {
            id: user?._id || user?.id || "",
            email: data.email,
            fullName: data.name,
            role: data.stack === "tutor" ? "admin" : "student",
          },
          token: token,
          refreshToken: token,
        }),
      );

      toast.success("Account created successfully!");
      router.push("/login");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <AuthLayout title="Sign Up" subtitle="Create your account to get started.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* {authError && (
          <div className="rounded-lg bg-[#ec1c24]/10 p-3 text-sm text-[#ec1c24]">
            {authError}
          </div>
        )} */}

        {/* Avatar Upload */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-[#ffb703]">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="bg-[#f3f4f6] text-[#687182] text-xl">
                {name?.[0]}
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

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            {...register("name")}
            className="h-11"
          />
          {errors.name && (
            <p className="text-sm text-[#ec1c24]">{errors.name.message}</p>
          )}
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

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+234 800 000 0000"
            {...register("phone")}
            className="h-11"
          />
          {errors.phone && (
            <p className="text-sm text-[#ec1c24]">{errors.phone.message}</p>
          )}
        </div>

        {/* Hub Selection */}
        <div className="space-y-2">
          <Label htmlFor="hub">Hub</Label>
          <Select
            onValueChange={(value) => setValue("hub", value as "hq" | "festac")}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your hub" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hq">HQ</SelectItem>
              <SelectItem value="festac">Festac</SelectItem>
            </SelectContent>
          </Select>
          {errors.hub && (
            <p className="text-sm text-[#ec1c24]">{errors.hub.message}</p>
          )}
        </div>

        {/* Stack Selection */}
        <div className="space-y-2">
          <Label htmlFor="stack">Stack / Course</Label>
          <Select
            onValueChange={(value) =>
              setValue(
                "stack",
                value as "frontend" | "backend" | "product design" | "tutor",
              )
            }
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your stack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="product design">Product Design</SelectItem>
              <SelectItem value="tutor">Tutor</SelectItem>
            </SelectContent>
          </Select>
          {errors.stack && (
            <p className="text-sm text-[#ec1c24]">{errors.stack.message}</p>
          )}
        </div>

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
