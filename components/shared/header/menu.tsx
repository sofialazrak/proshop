import { EllipsisVertical, ShoppingCart } from "lucide-react";
import type { Session } from "next-auth";
import ModeToggle from "./mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UserButton from "./user-button";

const Menu = ({ session }: { session: Session | null }) => {
  return (
    <div className="flex justify-end gap-3">
      <nav className="hidden md:flex w-full max-w-xs gap-1">
        <ModeToggle />
        <Link href="/cart" className={buttonVariants({ variant: "ghost" })}>
          <ShoppingCart /> Cart
        </Link>
        <UserButton session={session} />
      </nav>
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger className="align-middle">
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className="flex flex-col items-start p-4">
            <SheetTitle>Menu</SheetTitle>
            <ModeToggle />
            <Link href="/cart" className={buttonVariants({ variant: "ghost" })}>
              <ShoppingCart /> Cart
            </Link>
            <UserButton session={session} />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
