import { z } from "zod";
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  billingAddressSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  paymentResultSchema,
  insertReviewSchema,
} from "@/lib/validators";
import { Prisma } from "@prisma/client";

export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  numReviews: number;
  createdAt: Date;
};

export type Cart = z.infer<typeof insertCartSchema>;

export type CartItem = z.infer<typeof cartItemSchema>;

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export type BillingAddress = z.infer<typeof billingAddressSchema>;

export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  userId: string;
  isPaid: boolean;
  paidAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
  isCancelled: boolean;
  cancelledAt: Date | null;
  createdAt: Date;
  orderitems: OrderItem[];
  paymentResult: PaymentResult | Prisma.JsonValue | null;
  user: {
    name: string;
    email: string;
    billingAddress?: BillingAddress | Prisma.JsonValue | null;
  };
};

export type OrderItem = z.infer<typeof insertOrderItemSchema>;

export type PaymentResult = z.infer<typeof paymentResultSchema>;

export type Review = z.infer<typeof insertReviewSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  user?: { name: string };
};
