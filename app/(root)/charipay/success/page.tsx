import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  findChariPayOrderId,
  getChariPayReturnCandidates,
  isChariPayFailedReturn,
  type ChariPayReturnSearchParams,
} from "@/lib/charipay-order";

const ChariPaySuccessPage = async (props: {
  searchParams: Promise<ChariPayReturnSearchParams>;
}) => {
  const searchParams = await props.searchParams;

  if (isChariPayFailedReturn(searchParams)) {
    const queryString = new URLSearchParams(
      Object.entries(searchParams).filter((entry): entry is [string, string] =>
        Boolean(entry[1]),
      ),
    ).toString();

    redirect(`/charipay/cancel${queryString ? `?${queryString}` : ""}`);
  }

  const candidates = getChariPayReturnCandidates(searchParams);
  const orderId = await findChariPayOrderId(candidates, {
    attempts: 10,
    delayMs: 500,
  });

  if (orderId) {
    redirect(`/order/${orderId}`);
  }

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="h2-bold">Payment received</h1>
      <p className="text-muted-foreground">
        Your payment was received, but we could not find the matching order.
      </p>

      <Link href="/user/orders" className={buttonVariants()}>
        View orders
      </Link>
    </div>
  );
};

export default ChariPaySuccessPage;
