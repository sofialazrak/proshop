import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { generateInvoicePdf } from "@/lib/invoice-pdf";
import { BillingAddress, ShippingAddress } from "@/types";
import { notFound, redirect } from "next/navigation";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const session = await auth();

  if (!session) {
    redirect(`/sign-in?callbackUrl=/order/${id}`);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderitems: true,
      user: {
        select: {
          name: true,
          email: true,
          billingAddress: true,
        },
      },
    },
  });

  if (!order) notFound();

  if (order.userId !== session.user.id && session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  if (!order.isPaid) {
    return new Response("Invoice is only available for paid orders.", {
      status: 403,
    });
  }

  const shippingAddress = order.shippingAddress as ShippingAddress;
  const billingAddress = (order.user
    .billingAddress as BillingAddress | null) || {
    type: "individual",
    fullName: shippingAddress.fullName,
    companyName: "",
    ice: "",
    email: order.user.email,
    phone: shippingAddress.phone,
    streetAddress: shippingAddress.streetAddress,
    city: shippingAddress.city,
    postalCode: shippingAddress.postalCode,
    country: shippingAddress.country,
  };

  const pdf = generateInvoicePdf({
    id: order.id,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    paymentMethod: order.paymentMethod,
    shippingAddress,
    billingAddress,
    orderitems: order.orderitems.map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price.toString(),
    })),
    itemsPrice: order.itemsPrice.toString(),
    shippingPrice: order.shippingPrice.toString(),
    taxPrice: order.taxPrice.toString(),
    totalPrice: order.totalPrice.toString(),
  });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.id}.pdf"`,
    },
  });
}
