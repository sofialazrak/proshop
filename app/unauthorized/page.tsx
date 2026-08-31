import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unauthorized Access",
};

const Unauthorized = () => {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center space-y-4 h-[calc(100vh-200px)]">
      <h1 className="h1-bold text-4xl">Unauthorized Access</h1>
      <p className="text-muted-foreground">
        You do not have permission to access this page
      </p>
      <Link href="/" className={buttonVariants()}>
        Return home
      </Link>
    </div>
  );
};

export default Unauthorized;
