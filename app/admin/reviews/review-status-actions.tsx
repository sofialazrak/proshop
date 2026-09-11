"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { updateReviewStatus } from "@/lib/actions/review.actions";
import { useTransition } from "react";

const ReviewStatusActions = ({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = (nextStatus: "pending" | "published" | "rejected") => {
    startTransition(async () => {
      const res = await updateReviewStatus({ reviewId, status: nextStatus });

      toast.add({
        type: res.success ? "default" : "error",
        description: res.message,
      });
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" && (
        <Button
          type="button"
          size="sm"
          className="bg-green-700 text-white hover:bg-green-800"
          disabled={isPending}
          onClick={() => handleUpdateStatus("published")}
        >
          Publish
        </Button>
      )}
      {status !== "rejected" && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="bg-red-600 text-white hover:bg-red-700"
          disabled={isPending}
          onClick={() => handleUpdateStatus("rejected")}
        >
          Reject
        </Button>
      )}
      {status !== "pending" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => handleUpdateStatus("pending")}
        >
          Pending
        </Button>
      )}
    </div>
  );
};

export default ReviewStatusActions;
