import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound, redirect } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";
import { auth } from "@/auth";
import Stripe from "stripe";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

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
  if (!order.isPaid && order.paymentMethod === "Stripe") {
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
    <OrderDetailsTable
      order={{
        ...order,
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      stripeClientSecret={client_secret}
      paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
      isAdmin={session.user.role === "admin"}
    />
  );
};

export default OrderDetailsPage;
