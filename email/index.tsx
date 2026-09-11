import { Resend } from "resend";
import { SENDER_EMAIL, APP_NAME } from "@/lib/constants";
import { Order } from "@/types";
import PurchaseReceiptEmail from "./purchase-receipt";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPurchaseReceipt(order: Order) {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: order.user.email,
    subject: `Order confirmation ${order.id}`,
    react: <PurchaseReceiptEmail order={order} />,
  });
}

export async function sendPaymentLinkEmail({
  to,
  orderId,
  orderUrl,
}: {
  to: string;
  orderId: string;
  orderUrl: string;
}) {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to,
    subject: `Complete payment for order ${orderId}`,
    html: `
      <p>Your payment was not completed.</p>
      <p>Please return to your order to choose a payment method or try again:</p>
      <p><a href="${orderUrl}">${orderUrl}</a></p>
    `,
  });
}
