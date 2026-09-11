"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader, RotateCcw } from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateUserBillingAddress } from "@/lib/actions/user.actions";
import { billingAddressDefaultValues } from "@/lib/constants";
import { billingAddressSchema } from "@/lib/validators";
import { cn } from "@/lib/utils";
import { BillingAddress, ShippingAddress } from "@/types";

const getBillingDefaults = (
  billingAddress: BillingAddress | null,
  shippingAddress: ShippingAddress | null,
) => ({
  ...billingAddressDefaultValues,
  fullName: shippingAddress?.fullName || "",
  phone: shippingAddress?.phone || "",
  streetAddress: shippingAddress?.streetAddress || "",
  city: shippingAddress?.city || "",
  postalCode: shippingAddress?.postalCode || "",
  country: shippingAddress?.country || "",
  ...billingAddress,
});

const BillingAddressForm = ({
  billingAddress,
  shippingAddress,
  redirectTo = "/place-order",
  title = "Billing Details",
  description = "Use your shipping address, or add separate invoice details.",
  submitLabel = "Save billing details",
  className,
  compactHeader = false,
}: {
  billingAddress: BillingAddress | null;
  shippingAddress: ShippingAddress | null;
  redirectTo?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
  compactHeader?: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof billingAddressSchema>>({
    resolver: zodResolver(billingAddressSchema),
    defaultValues: getBillingDefaults(billingAddress, shippingAddress),
  });

  const type = useWatch({
    control: form.control,
    name: "type",
  });

  const onSubmit: SubmitHandler<z.infer<typeof billingAddressSchema>> = async (
    values,
  ) => {
    startTransition(async () => {
      const res = await updateUserBillingAddress(values);

      if (!res.success) {
        toast.add({
          type: "error",
          description: res.message,
        });
        return;
      }

      router.push(redirectTo);
    });
  };

  const useShippingAddress = () => {
    startTransition(async () => {
      const res = await updateUserBillingAddress(null);

      if (!res.success) {
        toast.add({
          type: "error",
          description: res.message,
        });
        return;
      }

      router.push(redirectTo);
    });
  };

  return (
    <div className={cn("max-w-md mx-auto space-y-4", className)}>
      <h1 className={compactHeader ? "text-xl" : "h2-bold mt-4"}>{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>

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
              <FieldLegend>Customer Type</FieldLegend>
              <RadioGroup
                name={field.name}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                aria-invalid={fieldState.invalid}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { label: "Individual", value: "individual" },
                  { label: "Company", value: "company" },
                ].map((option) => (
                  <Field
                    key={option.value}
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                    className="items-center gap-3 rounded-md border p-3 cursor-pointer"
                    onClick={() => field.onChange(option.value)}
                  >
                    <RadioGroupItem id={option.value} value={option.value} />
                    <FieldLabel
                      htmlFor={option.value}
                      className="w-full cursor-pointer font-normal"
                    >
                      {option.label}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldSet>
          )}
        />

        {type === "company" && (
          <>
            <Controller
              control={form.control}
              name="companyName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Company Name</FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ""}
                    id={field.name}
                    placeholder="Enter company name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="ice"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ICE</FieldLabel>
                  <Input
                    {...field}
                    value={field.value || ""}
                    id={field.name}
                    placeholder="Enter ICE"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </>
        )}

        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter full name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Billing Email</FieldLabel>
              <Input
                {...field}
                value={field.value || ""}
                id={field.name}
                type="email"
                placeholder="Enter billing email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Billing Phone</FieldLabel>
              <Input
                {...field}
                value={field.value || ""}
                id={field.name}
                type="tel"
                placeholder="Enter billing phone"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="streetAddress"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Billing Address</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter billing address"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="city"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>City</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Enter city"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="postalCode"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Enter postal code"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Country</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter country"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={useShippingAddress}
          >
            <RotateCcw className="w-4 h-4" />
            Same as shipping
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BillingAddressForm;
