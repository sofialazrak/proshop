"use client";

import { createOrder } from "@/lib/actions/order.actions";
import { useFormStatus } from "react-dom";
import { Check, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const PlaceOrderButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      disabled={pending}
      variant="default"
    >
      {pending ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
        </>
      ) : (
        <Check className="mr-2 h-4 w-4" />
      )}{" "}
      Place Order
    </Button>
  );
};

const PlaceOrderForm = () => {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const res = await createOrder();
    if (res.redirectTo) {
      router.push(res.redirectTo);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <PlaceOrderButton />
    </form>
  );
};

export default PlaceOrderForm;
