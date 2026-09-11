import { auth } from "@/auth";
import { Metadata } from "next";
import { getUserById } from "@/lib/actions/user.actions";
import { getOrderById } from "@/lib/actions/order.actions";
import PaymentMethodForm from "./payment-method-form";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Select Payment Method",
};

const PaymentMethodPage = async (props: {
  searchParams: Promise<{ orderId?: string }>;
}) => {
  const { orderId } = await props.searchParams;
  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("User not found.");
  }

  const user = await getUserById(userId);
  let preferredPaymentMethod = user?.paymentMethod;

  if (orderId) {
    const order = await getOrderById(orderId);

    if (!order) redirect("/user/orders");

    if (order.userId !== userId && session.user.role !== "admin") {
      redirect("/unauthorized");
    }

    if (order.isPaid) {
      redirect(`/order/${order.id}`);
    }

    preferredPaymentMethod = order.paymentMethod;
  }

  return (
    <>
      {!orderId && <CheckoutSteps current={2} />}
      <PaymentMethodForm
        orderId={orderId}
        preferredPaymentMethod={preferredPaymentMethod}
      />
    </>
  );
};

export default PaymentMethodPage;
