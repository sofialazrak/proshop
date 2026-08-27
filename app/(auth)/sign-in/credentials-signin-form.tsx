"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInDefaultValues } from "@/lib/constants";
import Link from "next/link";
import { signInWithCredentials } from "@/lib/actions/user.actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

const RESET_PASSWORD_SENT_MESSAGE =
  "Check your inbox. A password reset link has been sent to your email.";
const RESET_PASSWORD_SUCCESS_MESSAGE =
  "Password reset successfully. Sign in with your new password.";

const SignInButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
      variant="default"
    >
      {pending ? "Signing in ..." : "Sign In"}
    </Button>
  );
};

const CredentialsSignInForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const reset = searchParams.get("reset");
  const email = searchParams.get("email") || signInDefaultValues.email;
  const resetMessage =
    reset === "sent"
      ? RESET_PASSWORD_SENT_MESSAGE
      : reset === "success"
        ? RESET_PASSWORD_SUCCESS_MESSAGE
        : "";
  const showResetBanner = Boolean(resetMessage);

  const [data, action] = useActionState(signInWithCredentials, {
    success: false,
    message: "",
  });

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-6">
        {showResetBanner && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {resetMessage}
          </div>
        )}

        <div>
          <Label htmlFor="email" className="mb-2">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email}
          />
        </div>
        <div>
          <Label htmlFor="password" className="mb-2">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="password"
            defaultValue={signInDefaultValues.password}
          />
          <div className="text-sm text-right">
            <Link href="/forgot-password" className="link">
              Forgot password?
            </Link>
          </div>
        </div>
        <div>
          <SignInButton />
        </div>
        {data && !data.success && (
          <div className="text-center text-destructive">{data.message}</div>
        )}
        <div className="text-sm text-center text-muted-foreground">
          Don&apos;t have an account ?{" "}
          <Link href="/sign-up" target="_self" className="link">
            Sign Up
          </Link>
        </div>
      </div>
    </form>
  );
};

export default CredentialsSignInForm;
