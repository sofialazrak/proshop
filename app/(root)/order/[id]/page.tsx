import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound, redirect } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";
import { auth } from "@/auth";
import Stripe from "stripe";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) => {
  const { id } = await props.params;
  const { payment } = await props.searchParams;

  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    return redirect(`/sign-in?callbackUrl=/order/${id}`);
  }

  // Redirect the user if they don't own the order
  if (order.userId !== session.user.id && session.user.role !== "admin") {
    return redirect("/unauthorized");
  }

  let client_secret = null;

  // Check if it is nit paid and using Stripe
  if (
    !order.isPaid &&
    !order.isCancelled &&
    order.paymentMethod === "Stripe" &&
    session.user.role !== "admin"
  ) {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalPrice)) * 100, // Amount in cents
      currency: "USD",
      metadata: { orderId: order.id },
    });
    client_secret = paymentIntent.client_secret;
  }

  return (
    <div className="space-y-4">
      {order.isCancelled ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Order cancelled</p>
            <p>This order has been cancelled and can no longer be paid.</p>
          </div>
        </div>
      ) : payment === "failed" && !order.isPaid ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Payment was not completed</p>
            <p>
              Your card was declined or the payment was cancelled. Please check
              your details and try again.
            </p>
          </div>
        </div>
      ) : null}

      <OrderDetailsTable
        order={{
          ...order,
          shippingAddress: order.shippingAddress as ShippingAddress,
        }}
        stripeClientSecret={client_secret}
        paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
        isAdmin={session.user.role === "admin"}
        showChangePaymentMethod={payment === "failed"}
      />
    </div>
  );
};

export default OrderDetailsPage;
