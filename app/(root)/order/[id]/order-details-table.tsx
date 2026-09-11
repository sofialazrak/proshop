"use client";

import { Order } from "@/types";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import {
  approvePaypalOrder,
  cancelOrder,
  createChariPayOrder,
  createPaypalOrder,
  deliverOrder,
  sendOrderPaymentLink,
  updateOrderToPaidCOD,
} from "@/lib/actions/order.actions";
import { toast } from "@/components/ui/toast";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import StripePayment from "./stripe-payment";

const PrintLoadingState = () => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  let status = "";
  if (isPending) {
    status = "Loading ...";
  } else if (isRejected) {
    status = "Error loading Paypal";
  }

  return status;
};

// Button to mark order as paid
const MarkAsPaidButton = ({ orderId }: { orderId: string }) => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      className="w-full bg-green-700 text-white hover:bg-green-800"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await updateOrderToPaidCOD(orderId);

          toast.add({
            type: res.success ? "default" : "error",
            description: res.message,
          });
        })
      }
    >
      {isPending ? "Processing..." : "Mark as paid"}
    </Button>
  );
};

// Button to mark order as delivered
const MarkAsDeliveredButton = ({ orderId }: { orderId: string }) => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await deliverOrder(orderId);

          toast.add({
            type: res.success ? "default" : "error",
            description: res.message,
          });
        })
      }
    >
      {isPending ? "Processing..." : "Mark as delivered"}
    </Button>
  );
};

const SendPaymentLinkButton = ({ orderId }: { orderId: string }) => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendOrderPaymentLink(orderId);

          toast.add({
            type: res.success ? "default" : "error",
            description: res.message,
          });
        })
      }
    >
      {isPending ? "Sending..." : "Send customer payment link"}
    </Button>
  );
};

const CancelOrderButton = ({ orderId }: { orderId: string }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCancelOrder = () => {
    startTransition(async () => {
      const res = await cancelOrder(orderId);

      toast.add({
        type: res.success ? "default" : "error",
        description: res.message,
      });

      if (res.success) {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            className="w-full bg-red-600 text-white hover:bg-red-700"
            disabled={isPending}
          />
        }
      >
        Cancel order
      </AlertDialogTrigger>
      <AlertDialogContent className="border-red-200">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the order as cancelled for the customer. It can no
            longer be paid or delivered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep order</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isPending}
            onClick={handleCancelOrder}
          >
            {isPending ? "Cancelling..." : "Yes, cancel order"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ChariPayButton = ({ orderId }: { orderId: string }) => {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await createChariPayOrder(orderId);

          if (!res.success || !res.url) {
            toast.add({
              type: "error",
              description: res.message,
            });
            return;
          }

          window.location.href = res.url;
        })
      }
    >
      {isPending ? "Redirecting..." : "Pay with ChariPay"}
    </Button>
  );
};

const OrderDetailsTable = ({
  order,
  stripeClientSecret,
  paypalClientId,
  isAdmin,
  showChangePaymentMethod = false,
}: {
  order: Order;
  stripeClientSecret: string | null;
  paypalClientId: string;
  isAdmin: boolean;
  showChangePaymentMethod?: boolean;
}) => {
  const {
    id,
    shippingAddress,
    orderitems,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    isCancelled,
    cancelledAt,
    paymentMethod,
    paymentResult,
  } = order;
  const isOnlinePaymentMethod = ["Paypal", "Stripe", "ChariPay"].includes(
    paymentMethod,
  );
  const paymentResultStatus =
    paymentResult &&
    typeof paymentResult === "object" &&
    "status" in paymentResult
      ? String(paymentResult.status)
      : "";
  const paymentResultProvider =
    paymentResult &&
    typeof paymentResult === "object" &&
    "provider" in paymentResult
      ? String(paymentResult.provider)
      : "";
  const canChangePaymentMethod =
    !isPaid &&
    !isCancelled &&
    (showChangePaymentMethod ||
      (paymentResultProvider === paymentMethod &&
        ["FAILED", "CANCELLED", "DECLINED"].includes(
          paymentResultStatus.toUpperCase(),
        )));
  const canMarkAsPaid = isAdmin && !isPaid && !isCancelled;
  const canSendPaymentLink =
    isAdmin && !isPaid && !isCancelled && isOnlinePaymentMethod;
  const canCancelOrder = isAdmin && !isPaid && !isDelivered && !isCancelled;

  const handleCreatePaypalOrder = async () => {
    const res = await createPaypalOrder(order.id);

    if (!res.success) {
      toast.add({
        type: "error",
        description: res.message,
      });
    }
    return res.data;
  };

  const handleApprovePaypalOrder = async (data: { orderID: string }) => {
    const res = await approvePaypalOrder(order.id, data);

    toast.add({
      type: res.success ? "default" : "error",
      description: res.message,
    });
  };

  return (
    <>
      <h1 className="py-4 text-2xl">Order {formatId(id)}</h1>
      <div className="grid md:grid-cols-2 md:gap-5">
        <div className="cols-span-2 space-4-y overflow-x-auto">
          <Card>
            <CardContent className="gap-4 p-4">
              <h2 className="text-xl pb-4">Payment Method</h2>
              <p className="mb-2">{paymentMethod}</p>
              {isCancelled ? (
                <Badge variant="destructive">
                  Cancelled
                  {cancelledAt
                    ? ` at ${formatDateTime(cancelledAt).dateTime}`
                    : ""}
                </Badge>
              ) : isPaid ? (
                <Badge variant="secondary">
                  Paid at {formatDateTime(paidAt!).dateTime}
                </Badge>
              ) : paymentMethod === "CashOnDelivery" ? (
                <Badge variant="destructive">Payment due on delivery</Badge>
              ) : (
                <div className="space-y-3">
                  <Badge variant="destructive">Not Paid</Badge>
                  {canChangePaymentMethod && !isAdmin && (
                    <div>
                      <Link
                        href={`/payment-method?orderId=${order.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        Change payment method
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="my-2">
            <CardContent className="gap-4 p-4">
              <h2 className="text-xl pb-4">Shipping Address</h2>
              <p> {shippingAddress.fullName}</p>
              <p>{shippingAddress.phone}</p>
              <p className="mb-2">
                {shippingAddress.streetAddress}, {shippingAddress.city} <br />
                {shippingAddress.postalCode}, {shippingAddress.country}
              </p>
              {isCancelled ? (
                <Badge variant="destructive">
                  Order cancelled
                  {cancelledAt
                    ? ` at ${formatDateTime(cancelledAt).dateTime}`
                    : ""}
                </Badge>
              ) : isDelivered ? (
                <Badge variant="secondary">
                  Delivered at {formatDateTime(deliveredAt!).dateTime}
                </Badge>
              ) : (
                <Badge variant="destructive">Not Delivered</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderitems.map((item) => (
                    <TableRow key={item.slug}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          />
                          <span className="px-2">{item.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="px-2">{item.qty}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${item.price}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-4 gap-4 space-y-4">
              <div className="flex justify-between">
                <div>Items</div>
                <div>{formatCurrency(itemsPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Tax</div>
                <div>{formatCurrency(taxPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Shipping</div>
                <div>{formatCurrency(shippingPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Total</div>
                <div>{formatCurrency(totalPrice)}</div>
              </div>
              {isPaid && (
                <Link
                  href={`/order/${order.id}/invoice`}
                  target="_blank"
                  className={buttonVariants({
                    variant: "invoice",
                    className: "w-full",
                  })}
                >
                  View invoice PDF
                </Link>
              )}
              {/* Paypal Payment */}
              {!isAdmin &&
                !isPaid &&
                !isCancelled &&
                paymentMethod === "Paypal" && (
                  <div>
                    <PayPalScriptProvider
                      options={{ clientId: paypalClientId }}
                    >
                      <PrintLoadingState />
                      <PayPalButtons
                        createOrder={handleCreatePaypalOrder}
                        onApprove={handleApprovePaypalOrder}
                      />
                    </PayPalScriptProvider>
                  </div>
                )}
            </CardContent>
            {/* Cash on Delivery */}
            <div className="space-y-2 p-4 pt-0">
              {canMarkAsPaid && <MarkAsPaidButton orderId={order.id} />}
              {canSendPaymentLink && (
                <SendPaymentLinkButton orderId={order.id} />
              )}
              {isAdmin && isPaid && !isDelivered && !isCancelled && (
                <MarkAsDeliveredButton orderId={order.id} />
              )}
              {canCancelOrder && <CancelOrderButton orderId={order.id} />}
            </div>
            {/* Stripe Payment */}
            {!isAdmin &&
              !isPaid &&
              !isCancelled &&
              paymentMethod === "Stripe" &&
              stripeClientSecret && (
                <StripePayment
                  priceInCents={Number(order.totalPrice) * 100}
                  orderId={order.id}
                  clientSecret={stripeClientSecret}
                />
              )}
            {/* ChariPay */}
            {!isAdmin &&
              !isPaid &&
              !isCancelled &&
              paymentMethod === "ChariPay" && (
                <ChariPayButton orderId={order.id} />
              )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsTable;
