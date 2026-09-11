import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import {
  findChariPayOrderId,
  getChariPayReturnCandidates,
  type ChariPayReturnSearchParams,
} from "@/lib/charipay-order";

async function findLatestUnpaidUserChariPayOrderId() {
  const session = await auth();

  if (!session?.user?.id) return;

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      paymentMethod: "ChariPay",
      isPaid: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return order?.id;
}

const ChariPayCancelPage = async (props: {
  searchParams: Promise<ChariPayReturnSearchParams>;
}) => {
  const searchParams = await props.searchParams;
  const candidates = getChariPayReturnCandidates(searchParams);
  const orderId =
    (await findChariPayOrderId(candidates)) ||
    (await findLatestUnpaidUserChariPayOrderId());

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentResult: {
          id: searchParams.ORDER_ID || searchParams.orderId || orderId,
          status: "FAILED",
          email_address: "",
          pricePaid: "",
          provider: "ChariPay",
          reason:
            searchParams.REASON_CODE ||
            searchParams.reasonCode ||
            "Payment was cancelled",
        },
      },
    });

    redirect(`/order/${orderId}?payment=failed`);
  }

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="h2-bold">Payment cancelled</h1>
      <p className="text-muted-foreground">
        Your payment was cancelled, but we could not find the matching order.
      </p>

      <Link href="/user/orders" className={buttonVariants()}>
        View orders
      </Link>
    </div>
  );
};

export default ChariPayCancelPage;
