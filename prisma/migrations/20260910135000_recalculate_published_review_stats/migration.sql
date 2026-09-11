UPDATE "Product"
SET
  "rating" = 0,
  "numReviews" = 0;

UPDATE "Product" AS p
SET
  "rating" = stats."averageRating",
  "numReviews" = stats."numReviews"
FROM (
  SELECT
    "productId",
    AVG("rating")::numeric(3, 2) AS "averageRating",
    COUNT(*)::integer AS "numReviews"
  FROM "Review"
  WHERE "status" = 'published'
  GROUP BY "productId"
) AS stats
WHERE p."id" = stats."productId";
