"use client";

import { productDefaultValues } from "@/lib/constants";
import { productFormSchema } from "@/lib/validators";
import { Product } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import slugify from "slugify";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/product.actions";
import { UploadButton } from "@/lib/uploadthing";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";
import { toast } from "../ui/toast";
import { Field, FieldError, FieldLabel } from "../ui/field";

type ProductFormInput = z.input<typeof productFormSchema>;
type ProductFormValues = z.output<typeof productFormSchema>;

const ProductForm = ({
  type,
  product,
  productId,
}: {
  type: "Create" | "Update";
  product?: Product;
  productId?: string;
}) => {
  const router = useRouter();

  const defaultValues: ProductFormInput =
    product && type === "Update"
      ? {
          id: productId ?? product.id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          images: product.images,
          brand: product.brand,
          description: product.description,
          price: product.price.toString(),
          stock: product.stock,
          isFeatured: product.isFeatured,
          banner: product.banner,
        }
      : productDefaultValues;

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
    const res =
      type === "Create"
        ? await createProduct(values)
        : productId
          ? await updateProduct({ ...values, id: productId })
          : {
              success: false,
              message: "Product ID is missing",
            };

    toast.add({
      type: res.success ? "success" : "error",
      description: res.message,
    });

    if (res.success) {
      router.push("/admin/products");
    }
  };

  const images = form.watch("images");
  const isFeatured = form.watch("isFeatured");
  const banner = form.watch("banner");

  return (
    <form
      method="POST"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-5">
        {/* Name */}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter product name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* Slug */}
        <Controller
          control={form.control}
          name="slug"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Enter slug"
                  aria-invalid={fieldState.invalid}
                />
                <Button
                  type="button"
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1 mt-2"
                  onClick={() => {
                    form.setValue(
                      "slug",
                      slugify(form.getValues("name"), { lower: true }),
                    );
                  }}
                >
                  Generate
                </Button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-5">
        {/* Category */}
        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Category</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter category"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* Brand */}
        <Controller
          control={form.control}
          name="brand"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Brand</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter brand"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-5">
        {/* Price */}
        <Controller
          control={form.control}
          name="price"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Price</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter product price"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* Stock */}
        <Controller
          control={form.control}
          name="stock"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Stock</FieldLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Enter stock"
                value={field.value as string | number | undefined}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="upload-field flex flex-col md:flex-row gap-5">
        {/* Images */}
        <Controller
          control={form.control}
          name="images"
          render={({ fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Images</FieldLabel>
              <Card>
                <CardContent className="space-y-2 mt-2 min-h-48">
                  <div className="flex-start space-x-2">
                    {images.map((image: string) => (
                      <Image
                        key={image}
                        src={image}
                        alt="product image"
                        className="w-20 h-20 object-cover object-center rounded-sm"
                        width={100}
                        height={100}
                      />
                    ))}
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        form.setValue("images", [...images, res[0].ufsUrl]);
                      }}
                      onUploadError={(error: Error) => {
                        toast.add({
                          type: "error",
                          description: `ERROR! ${error.message}`,
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div className="upload-field">
        {/* isFeatured */}
        Featured Product
        <Card>
          <CardContent className="space-y-2 mt-2">
            <Controller
              control={form.control}
              name="isFeatured"
              render={({ field, fieldState }) => (
                <Field
                  orientation="horizontal"
                  data-invalid={fieldState.invalid}
                  className="items-center"
                >
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor={field.name}>Is Featured?</FieldLabel>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {isFeatured && banner && (
              <Image
                src={banner}
                alt="banner image"
                className="w-full object-cover object-center rounded-sm"
                width={1920}
                height={680}
              />
            )}

            {isFeatured && !banner && (
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  form.setValue("banner", res[0].ufsUrl);
                }}
                onUploadError={(error: Error) => {
                  toast.add({
                    type: "error",
                    description: `ERROR! ${error.message}`,
                  });
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        {/* Description */}
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                placeholder="Enter product description"
                className="resize-none"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <div>
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting ? "Submitting" : `${type} Product`}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
