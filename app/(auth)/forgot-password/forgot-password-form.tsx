"use client";

import {
  checkPasswordResetCooldown,
  forgotPassword,
} from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

const COOLDOWN_MESSAGE =
  "Please wait a few minutes before requesting another reset link.";

const ForgotPasswordButton = ({ disabled }: { disabled: boolean }) => {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  const button = (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  );

  if (!disabled) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="block w-full cursor-not-allowed" />}
      >
        <Button
          type="button"
          disabled={isDisabled}
          className="w-full pointer-events-none"
        >
          Send Reset Link
        </Button>
      </TooltipTrigger>
      <TooltipContent>{COOLDOWN_MESSAGE}</TooltipContent>
    </Tooltip>
  );
};

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [checkedCooldown, setCheckedCooldown] = useState<{
    cooldownEmail: string | null;
    cooldownUntil: string | null;
  }>({
    cooldownEmail: null,
    cooldownUntil: null,
  });
  const [data, action] = useActionState(forgotPassword, {
    success: false,
    message: "",
    cooldownEmail: null as string | null,
    cooldownUntil: null as string | null,
  });

  const handleEmailBlur = async () => {
    const result = await checkPasswordResetCooldown(email);
    setCheckedCooldown(result);
  };

  const isCoolingDown =
    (Boolean(data.cooldownUntil) && data.cooldownEmail === email) ||
    (Boolean(checkedCooldown.cooldownUntil) &&
      checkedCooldown.cooldownEmail === email);

  return (
    <form action={action}>
      <div className="space-y-6">
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={handleEmailBlur}
          />
        </div>

        <ForgotPasswordButton disabled={isCoolingDown} />

        {data?.message && data.success && !data.cooldownUntil && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {data.message}
          </div>
        )}

        {data?.message && data.success && data.cooldownUntil && (
          <div className="rounded-md border border-muted bg-muted px-4 py-3 text-sm text-muted-foreground">
            {data.message}
          </div>
        )}

        {data?.message && !data.success && (
          <div className="text-center text-destructive">{data.message}</div>
        )}

        <div className="text-sm text-center text-muted-foreground">
          Remember your password?{" "}
          <Link href="/sign-in" className="link">
            Sign In
          </Link>
        </div>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
