"use client";

import { ShippingAddress } from "@/types";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { shippingAddressSchema } from "@/lib/validators";
import { toast } from "@/components/ui/toast";

const ShippingAddressForm = ({ address }: { address: ShippingAddress }) => {
  const router = useRouter();
  return <>Shipping Address Form</>;
};

export default ShippingAddressForm;
