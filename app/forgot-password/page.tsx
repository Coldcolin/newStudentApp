"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/lib/api/axios";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/users/forgot", {
        email: data.email,
      });

      setSubmittedEmail(data.email);
      toast.success("Reset link sent! Check your email.");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Failed to send reset link. Please try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you instructions to reset your password."
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-[#ffb703]/50 bg-[#ffb703]/10 p-6 text-center">
            <MailCheck className="h-10 w-10 text-[#ffb703]" />
            <p className="text-sm text-foreground">
              An email has been sent to{" "}
              <span className="font-semibold">{submittedEmail}</span> with a
              link and a token to reset your password. Follow the link in the
              email and enter the token along with your new password.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the email?{" "}
            <button
              type="button"
              onClick={() => setSubmittedEmail(null)}
              className="text-[#ffb703] hover:underline"
            >
              Try again
            </button>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link href="/login" className="text-[#ffb703] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email and we'll send you a link and token to reset your password."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-[#ffb703] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
