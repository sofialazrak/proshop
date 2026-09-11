"use server";

import { auth } from "@/auth";
import { insertReviewSchema } from "../validators";
import { z } from "zod";
import { formatError } from "@/lib/utils";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const REVIEW_STATUSES = ["pending", "published", "rejected"] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];
type ReviewStatsClient = Pick<typeof prisma, "review" | "product">;
const latestReviewsOrderBy = [
  { updatedAt: "desc" as const },
  { createdAt: "desc" as const },
  { id: "desc" as const },
];

async function updateProductReviewStats(
  tx: ReviewStatsClient,
  productId: string,
) {
  const averageRating = await tx.review.aggregate({
    where: { productId, status: "published" },
    _avg: { rating: true },
  });

  const numReviews = await tx.review.count({
    where: { productId, status: "published" },
  });

  await tx.product.update({
    where: { id: productId },
    data: {
      rating: averageRating._avg.rating || 0,
      numReviews,
    },
  });
}

// Create and update review
export async function createUpdateReview(
  data: z.infer<typeof insertReviewSchema>,
) {
  try {
    const session = await auth();
    if (!session) throw new Error("User not authenticated");

    // Validate and store the review
    const review = insertReviewSchema.parse({
      ...data,
      userId: session?.user?.id,
    });

    // Get the product that is being reviewed
    const product = await prisma.product.findFirst({
      where: { id: review.productId },
    });
    if (!product) throw new Error("Product not found");

    const verifiedPurchase = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        isPaid: true,
        orderitems: {
          some: {
            productId: review.productId,
          },
        },
      },
    });

    if (!verifiedPurchase) {
      throw new Error("You can only review products you have purchased");
    }

    // Check if the user has already reviewed this product
    const reviewExists = await prisma.review.findFirst({
      where: {
        productId: review.productId,
        userId: session?.user?.id,
      },
    });

    if (reviewExists?.status === "pending") {
      throw new Error("Your review is awaiting approval");
    }

    await prisma.$transaction(async (tx) => {
      if (reviewExists) {
        // Update the existing review
        await tx.review.update({
          where: { id: reviewExists.id },
          data: {
            title: review.title,
            description: review.description,
            rating: review.rating,
            status: "pending",
          },
        });
      } else {
        // Create a new review
        await tx.review.create({
          data: {
            ...review,
            isVerifiedPurchase: true,
            status: "pending",
          },
        });
      }
      await updateProductReviewStats(tx, review.productId);
    });
    revalidatePath(`/product/${product.slug}`);
    revalidatePath("/admin/reviews");
    return {
      success: true,
      message: "Review submitted and awaiting approval",
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all reviews for a product
export async function getReviews({ productId }: { productId: string }) {
  const data = await prisma.review.findMany({
    where: { productId, status: "published" },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: latestReviewsOrderBy,
  });
  return { data };
}

// Get a review written by the current user
export async function getReviewByProductId({
  productId,
}: {
  productId: string;
}) {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  return await prisma.review.findFirst({
    where: {
      productId,
      userId: session?.user?.id,
    },
  });
}

export async function getAllReviews({
  page = 1,
  limit = 10,
  query,
  status,
}: {
  page?: number;
  limit?: number;
  query?: string;
  status?: string;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("User is not authorized");

  const queryFilter: Prisma.ReviewWhereInput =
    query && query !== "all"
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            {
              user: {
                name: { contains: query, mode: "insensitive" },
              },
            },
            {
              product: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          ],
        }
      : {};

  const statusFilter: Prisma.ReviewWhereInput =
    status && REVIEW_STATUSES.includes(status as ReviewStatus)
      ? { status }
      : {};

  const where = {
    ...queryFilter,
    ...statusFilter,
  };

  const data = await prisma.review.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true, images: true } },
    },
    orderBy: latestReviewsOrderBy,
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.review.count({ where });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

export async function updateReviewStatus({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewStatus;
}) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      throw new Error("User is not authorized");
    }

    if (!REVIEW_STATUSES.includes(status)) {
      throw new Error("Invalid review status");
    }

    const review = await prisma.review.findFirst({
      where: { id: reviewId },
      include: { product: { select: { slug: true } } },
    });

    if (!review) throw new Error("Review not found");

    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { status },
      });

      await updateProductReviewStats(tx, review.productId);
    });

    revalidatePath(`/product/${review.product.slug}`);
    revalidatePath("/admin/reviews");

    return {
      success: true,
      message: `Review ${status}`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function getMyReviews({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("User not authenticated");

  const where = {
    userId: session.user.id,
  };

  const data = await prisma.review.findMany({
    where,
    include: {
      product: { select: { name: true, slug: true, images: true } },
    },
    orderBy: latestReviewsOrderBy,
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.review.count({ where });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}
