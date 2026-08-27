import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import ForgotPasswordForm from "./forgot-password-form";

const ForgotPasswordPage = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex-center">
            <Image
              src="/images/logo.svg"
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
              priority={true}
            />
          </Link>
          <CardTitle className="text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we will send you a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
