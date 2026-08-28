"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { paymentMethodSchema } from "@/lib/validators";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateUserPaymentMethod } from "@/lib/actions/user.actions";
import { toast } from "@/components/ui/toast";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const PaymentMethodForm = ({
  preferredPaymentMethod,
}: {
  preferredPaymentMethod: string | null;
}) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit: SubmitHandler<z.infer<typeof paymentMethodSchema>> = async (
    values,
  ) => {
    startTransition(async () => {
      const res = await updateUserPaymentMethod(values);

      if (!res.success) {
        toast.add({
          type: "error",
          description: res.message,
        });
        return;
      }

      router.push("/place-order");
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="h2-bold mt-4">Payment Method</h1>
      <p className="text-sm text-muted-foreground">
        Please select a payment method
      </p>

      <form
        method="post"
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <FieldSet>
              <FieldLegend>Payment Method</FieldLegend>

              <RadioGroup
                name={field.name}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                aria-invalid={fieldState.invalid}
                className="gap-3"
              >
                {PAYMENT_METHODS.map((paymentMethod) => (
                  <Field
                    key={paymentMethod}
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                    className="items-center gap-3 rounded-md border p-3 cursor-pointer"
                    onClick={() => field.onChange(paymentMethod)}
                  >
                    <RadioGroupItem
                      id={paymentMethod}
                      value={paymentMethod}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldLabel
                      htmlFor={paymentMethod}
                      className="w-full cursor-pointer font-normal"
                    >
                      {paymentMethod}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
