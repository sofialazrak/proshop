"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Button } from "../ui/button";
import { formUrlQuery } from "@/lib/utils";

type PaginationProps = {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
};

const getPageItems = (
  currentPage: number,
  totalPages: number,
): Array<number | "..."> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
};

const Pagination = ({ page, totalPages, urlParamName }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(page);

  const goToPage = (pageValue: number) => {
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: urlParamName || "page",
      value: pageValue.toString(),
    });
    router.push(newUrl);
  };

  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="lg"
        variant="outline"
        className="w-28"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        Previous
      </Button>

      {pageItems.map((item, index) =>
        item === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 w-10 items-center justify-center text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={item}
            size="lg"
            variant={item === currentPage ? "default" : "outline"}
            className="w-10 px-0"
            disabled={item === currentPage}
            onClick={() => goToPage(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        size="lg"
        variant="outline"
        className="w-28"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
