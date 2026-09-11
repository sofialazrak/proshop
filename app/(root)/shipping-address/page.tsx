import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShippingAddress } from "@/types";
import { getUserById } from "@/lib/actions/user.actions";
import ShippingAddressForm from "./shipping-adress-form";
import CheckoutSteps from "@/components/shared/checkout-steps";

export const metadata: Metadata = {
  title: "Shipping Address",
};

const ShippingAddressPage = async (props: {
  searchParams: Promise<{ from?: string }>;
}) => {
  const { from } = await props.searchParams;
  const isProfileEdit = from === "profile";

  const cart = await getMyCart();
  if (!isProfileEdit && (!cart || cart.items.length === 0)) redirect("/cart");

  const session = await auth();

  const userId = session?.user?.id;
  if (!userId) throw new Error("No use ID");

  const user = await getUserById(userId);

  return (
    <>
      {!isProfileEdit && <CheckoutSteps current={1} />}
      <ShippingAddressForm
        address={user.address as ShippingAddress}
        redirectTo={isProfileEdit ? "/user/profile" : "/payment-method"}
      />
    </>
  );
};

export default ShippingAddressPage;
