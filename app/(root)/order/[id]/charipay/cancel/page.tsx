import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const ChariPayCancelPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="h2-bold">Payment cancelled</h1>
      <p className="text-muted-foreground">Your order has not been paid yet.</p>
      <Link href={`/order/${id}`} className={buttonVariants()}>
        Try again
      </Link>
    </div>
  );
};

export default ChariPayCancelPage;
