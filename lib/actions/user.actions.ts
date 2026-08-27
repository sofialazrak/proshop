"use server";

import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators";
import { signIn, signOut } from "@/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { hash } from "@/lib/encrypt";
import { prisma } from "@/db/prisma";
import { formatError } from "../utils";
import { ShippingAddress } from "@/types";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { APP_NAME, SERVER_URL } from "../constants";

const resend = new Resend(process.env.RESEND_API_KEY);

type ForgotPasswordResult = {
  success: boolean;
  message: string;
  cooldownEmail: string | null;
  cooldownUntil: string | null;
};

const PASSWORD_RESET_COOLDOWN_MS = 1000 * 60 * 10;
const PASSWORD_RESET_SENT_MESSAGE =
  "Check your inbox. A password reset link has been sent to your email.";
const PASSWORD_RESET_COOLDOWN_MESSAGE =
  "Please wait a few minutes before requesting another reset link.";

export async function checkPasswordResetCooldown(email: string) {
  const parsedEmail = forgotPasswordSchema.safeParse({ email });

  if (!parsedEmail.success) {
    return {
      cooldownEmail: null,
      cooldownUntil: null,
    };
  }

  const cooldownStart = new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS);
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      email: parsedEmail.data.email,
      createdAt: {
        gt: cooldownStart,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!recentToken) {
    return {
      cooldownEmail: null,
      cooldownUntil: null,
    };
  }

  return {
    cooldownEmail: parsedEmail.data.email,
    cooldownUntil: new Date(
      recentToken.createdAt.getTime() + PASSWORD_RESET_COOLDOWN_MS,
    ).toISOString(),
  };
}

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData,
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    await signIn("credentials", {
      ...user,
      redirectTo: formData.get("callbackUrl")?.toString() || "/",
    });
    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: "Invalid email or password" };
  }
}

// Sign user out
export async function signOutUser() {
  const cookieStore = await cookies();
  cookieStore.set("sessionCartId", crypto.randomUUID());

  await signOut();
}

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    const plainPassword = user.password;
    user.password = await hash(user.password);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: plainPassword,
      redirectTo: formData.get("callbackUrl")?.toString() || "/",
    });
    return { success: true, message: "User registered successfully" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.log("SIGN UP ERROR:", {
      name: error instanceof Error ? error.name : undefined,
      constructorName:
        error && typeof error === "object"
          ? error.constructor?.name
          : undefined,
      code:
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined,
      meta:
        error && typeof error === "object" && "meta" in error
          ? error.meta
          : undefined,
      message: error instanceof Error ? error.message : error,
    });

    console.dir(error, { depth: null });
    return { success: false, message: formatError(error) };
  }
}

// Get user by the ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}

// Update user address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });
    if (!currentUser) throw new Error("User not found");

    const address = shippingAddressSchema.parse(data);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { address },
    });

    return {
      success: true,
      message: "User update successfully",
    };
  } catch (error) {
    return { succes: false, message: formatError(error) };
  }
}

// Update user password
export async function forgotPassword(
  prevState: unknown,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  try {
    const { email } = forgotPasswordSchema.parse({
      email: formData.get("email"),
    });

    const user = await prisma.user.findFirst({
      where: { email },
    });

    // Important: do not reveal if the email exists or not
    if (!user) {
      return {
        success: true,
        message: PASSWORD_RESET_SENT_MESSAGE,
        cooldownEmail: null,
        cooldownUntil: null,
      };
    }

    const cooldownStart = new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS);
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        createdAt: {
          gt: cooldownStart,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentToken) {
      return {
        success: true,
        message: PASSWORD_RESET_COOLDOWN_MESSAGE,
        cooldownEmail: email,
        cooldownUntil: new Date(
          recentToken.createdAt.getTime() + PASSWORD_RESET_COOLDOWN_MS,
        ).toISOString(),
      };
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    const resetUrl = `${SERVER_URL}/reset-password/${token}`;

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    await resend.emails.send({
      from: process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h1 style="font-size: 20px;">Reset your password</h1>
          <p>We received a request to reset your ${APP_NAME} password.</p>
          <p>
            <a
              href="${resetUrl}"
              style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;"
            >
              Reset Password
            </a>
          </p>
          <p>This link will expire in 30 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
          <p style="word-break: break-all;">${resetUrl}</p>
        </div>
      `,
    });

    return {
      success: true,
      message: PASSWORD_RESET_SENT_MESSAGE,
      cooldownEmail: null,
      cooldownUntil: null,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      cooldownEmail: null,
      cooldownUntil: null,
    };
  }
}

// Reset user password
export async function resetPassword(prevState: unknown, formData: FormData) {
  try {
    const data = resetPasswordSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: data.token },
    });

    if (!resetToken) {
      return {
        success: false,
        message: "Invalid or expired reset link",
      };
    }

    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token: data.token },
      });

      return {
        success: false,
        message: "Invalid or expired reset link",
      };
    }

    const user = await prisma.user.findFirst({
      where: { email: resetToken.email },
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid or expired reset link",
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hash(data.password),
      },
    });

    await prisma.passwordResetToken.delete({
      where: { token: data.token },
    });

    return {
      success: true,
      message: "Password reset successfully. You can now sign in.",
      email: user.email,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
      email: null,
    };
  }
}
