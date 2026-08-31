"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const AdminSearch = () => {
  const pathname = usePathname();
  const formActionUrl = pathname.includes("/admin/orders")
    ? "/admin/orders"
    : pathname.includes("/admin/users")
      ? "/admin/users"
      : "/admin/products";

  const searchParams = useSearchParams();
  const queryValue = searchParams.get("query") || "";

  return (
    <form action={formActionUrl} method="GET">
      <Input
        key={queryValue}
        type="search"
        placeholder="Search ..."
        name="query"
        defaultValue={queryValue}
        className="md:w-[100px] lg:w-[300px]"
      />
      <button className="sr-only" type="submit">
        Search
      </button>
    </form>
  );
};

export default AdminSearch;
