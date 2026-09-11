import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const ChariPaySuccessPage = async (props: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await props.params;

  return (
    <div className="max-w-md mx-auto space-y-4 text-center">
      <h1 className="h2-bold">Payment received</h1>
      <p className="text-muted-foreground">We are confirming your payment.</p>

      <Link href={`/order/${id}`} className={buttonVariants()}>
        View order
      </Link>
    </div>
  );
};

export default ChariPaySuccessPage;
