import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Pagination from "@/components/shared/pagination";
import Rating from "@/components/shared/product/rating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMyReviews } from "@/lib/actions/review.actions";
import { PAGE_SIZE } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Reviews",
};

const statusBadgeVariant = (status: string) => {
  if (status === "published") return "secondary";
  if (status === "rejected") return "destructive";
  return "outline";
};

const MyReviewsPage = async (props: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const { page = "1" } = await props.searchParams;

  const reviews = await getMyReviews({
    page: Number(page) || 1,
    limit: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">My Reviews</h1>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PRODUCT</TableHead>
              <TableHead>REVIEW</TableHead>
              <TableHead>RATING</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>DATE</TableHead>
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.data.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Link
                    href={`/product/${review.product.slug}`}
                    className="flex items-center gap-2"
                  >
                    {review.product.images[0] && (
                      <Image
                        src={review.product.images[0]}
                        alt={review.product.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    )}
                    <span>{review.product.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="max-w-sm">
                  <div className="font-medium">{review.title}</div>
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {review.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Rating value={review.rating} />
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(review.status)}>
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(review.createdAt).dateTime}</TableCell>
                <TableCell>
                  {review.status === "pending" ? (
                    <span className="text-sm text-muted-foreground">
                      Awaiting approval
                    </span>
                  ) : (
                    <Link
                      href={`/product/${review.product.slug}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      {review.status === "rejected"
                        ? "Edit and resubmit"
                        : "Edit"}
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {reviews.data.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            You have not written any reviews yet.
          </p>
        )}
      </div>

      {reviews.totalPages > 1 && (
        <Pagination page={Number(page) || 1} totalPages={reviews.totalPages} />
      )}
    </div>
  );
};

export default MyReviewsPage;
