"use client";

import { resetPassword } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

const ResetPasswordButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Resetting..." : "Reset Password"}
    </Button>
  );
};

const ResetPasswordForm = ({ token }: { token: string }) => {
  const router = useRouter();
  const [data, action] = useActionState(resetPassword, {
    success: false,
    message: "",
    email: null as string | null,
  });

  useEffect(() => {
    if (!data.message) return;

    if (data.success) {
      const emailParam = data.email
        ? `&email=${encodeURIComponent(data.email)}`
        : "";

      router.push(`/sign-in?reset=success${emailParam}`);
      return;
    }
  }, [data, router]);

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />

      <div className="space-y-6">
        <div>
          <Label htmlFor="password" className="mb-2">
            New Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="mb-2">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>

        <ResetPasswordButton />

        {data?.message && !data.success && (
          <div className="text-center text-destructive">{data.message}</div>
        )}
      </div>
    </form>
  );
};

export default ResetPasswordForm;
