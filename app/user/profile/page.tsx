import { Metadata } from "next";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import ProfileForm from "./profile-form";
import { getUserById } from "@/lib/actions/user.actions";
import { BillingAddress, ShippingAddress } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import ShippingAddressForm from "@/app/(root)/shipping-address/shipping-adress-form";
import BillingAddressForm from "@/app/(root)/billing-address/billing-address-form";

export const metadata: Metadata = {
  title: "Customer Profile",
};
const Profile = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("User not found");

  const user = await getUserById(userId);

  return (
    <SessionProvider session={session}>
      <div className="space-y-4">
        <h2 className="h2-bold">Profile</h2>
        <div className="mx-auto max-w-xl space-y-4">
          <Card className="h-fit">
            <CardContent className="space-y-4 p-4">
              <h3 className="mb-2 text-xl">Account Details</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Manage your name, email, and password.
              </p>
              <ProfileForm />
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardContent className="p-4">
              <ShippingAddressForm
                address={user.address as ShippingAddress}
                redirectTo="/user/profile"
                title="Shipping Address"
                description="Used for deliveries and payment contact."
                submitLabel="Update address"
                className="mx-0 max-w-none"
                compactHeader
              />
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardContent className="p-4">
              <BillingAddressForm
                billingAddress={user.billingAddress as BillingAddress | null}
                shippingAddress={user.address as ShippingAddress | null}
                redirectTo="/user/profile"
                title="Billing Details"
                description="Optional details for receipts and invoices."
                submitLabel="Update billing details"
                className="mx-0 max-w-none"
                compactHeader
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </SessionProvider>
  );
};

export default Profile;
