"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { signOutUser } from "@/lib/actions/user.actions";
import { Button } from "@/components/ui/button";
import { UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const UserButton = ({ session }: { session: Session | null }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const callbackUrl = queryString ? `${pathname}?${queryString}` : pathname;

  if (!session) {
    return (
      <Link
        href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className={buttonVariants({ variant: "dark" })}
      >
        <UserIcon /> Sign In
      </Link>
    );
  }

  const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? "U";
  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "relative w-8 h-8 rounded-full ml-2 flex items-center justify-center bg-gray-200",
          )}
        >
          {firstInitial}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <div className="text-sm font-medium leading-none">
                  {session.user?.name}
                </div>
                <div className="text-sm text-muted-foreground leading-none">
                  {session.user?.email}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href="/user/profile" className="w-full">
                User Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/user/orders" className="w-full">
                Order History
              </Link>
            </DropdownMenuItem>
            {session?.user?.role === "admin" && (
              <DropdownMenuItem>
                <Link href="/admin/overview" className="w-full">
                  Admin
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="p-0 mb-1">
              <form action={signOutUser} className="w-full">
                <Button
                  className="w-full py-4 px-2 h-4 justify-start"
                  variant="ghost"
                  type="submit"
                >
                  Sign Out
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
