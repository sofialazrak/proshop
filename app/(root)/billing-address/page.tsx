import { auth } from "@/auth";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { getUserById } from "@/lib/actions/user.actions";
import { BillingAddress, ShippingAddress } from "@/types";
import { Metadata } from "next";

import BillingAddressForm from "./billing-address-form";

export const metadata: Metadata = {
  title: "Billing Details",
};

const sanitizeRedirectTo = (redirectTo?: string) => {
  if (
    !redirectTo ||
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//")
  ) {
    return "/place-order";
  }

  return redirectTo;
};

const BillingAddressPage = async (props: {
  searchParams: Promise<{ redirectTo?: string; from?: string }>;
}) => {
  const { redirectTo, from } = await props.searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error("User not found");

  const user = await getUserById(userId);
  const isProfileEdit = from === "profile";

  return (
    <>
      {!isProfileEdit && <CheckoutSteps current={3} />}
      <BillingAddressForm
        billingAddress={user.billingAddress as BillingAddress | null}
        shippingAddress={user.address as ShippingAddress | null}
        redirectTo={
          isProfileEdit ? "/user/profile" : sanitizeRedirectTo(redirectTo)
        }
      />
    </>
  );
};

export default BillingAddressPage;
