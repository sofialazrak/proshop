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
import { getAllReviews } from "@/lib/actions/review.actions";
import { requireAdmin } from "@/lib/auth-guard";
import { PAGE_SIZE } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import ReviewStatusActions from "./review-status-actions";

export const metadata: Metadata = {
  title: "Admin reviews",
};

const statusBadgeVariant = (status: string) => {
  if (status === "published") return "secondary";
  if (status === "rejected") return "destructive";
  return "outline";
};

const AdminReviewsPage = async (props: {
  searchParams: Promise<{ page?: string; query?: string; status?: string }>;
}) => {
  await requireAdmin();

  const { page = "1", query = "", status = "" } = await props.searchParams;

  const reviews = await getAllReviews({
    page: Number(page) || 1,
    limit: PAGE_SIZE,
    query,
    status,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="h2-bold">Reviews</h1>
        {["pending", "published", "rejected"].map((item) => (
          <Link
            key={item}
            href={`/admin/reviews?status=${item}`}
            className={buttonVariants({
              variant: status === item ? "default" : "outline",
              size: "sm",
            })}
          >
            {item}
          </Link>
        ))}
        {(query || status) && (
          <Link
            href="/admin/reviews"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Clear
          </Link>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PRODUCT</TableHead>
              <TableHead>CUSTOMER</TableHead>
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
                <TableCell>
                  <div>{review.user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {review.user.email}
                  </div>
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
                  <ReviewStatusActions
                    reviewId={review.id}
                    status={review.status}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {reviews.data.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No reviews found</p>
        )}
      </div>

      {reviews.totalPages > 1 && (
        <Pagination page={Number(page) || 1} totalPages={reviews.totalPages} />
      )}
    </div>
  );
};

export default AdminReviewsPage;
