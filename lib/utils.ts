import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert prisma object into a regular JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format number with decimal places
export function formatNumberwithDecimal(num: number): string {
  const [int, decimal] = num.toString().split(".");
  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : `${int}.00`;
}

// Format errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatError(error: any) {
  const formatFieldName = (field: string) => {
    const fieldName = field
      .replace(/[`"'()[\]]/g, "")
      .replace(/_idx$|_key$/g, "")
      .split("_")
      .pop()!;

    return fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  };

  if (error.name === "ZodError") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldErrors = error.issues.map((issue: any) => issue.message);
    return fieldErrors.join(". ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    const field = Array.isArray(target) ? target[0] : target;

    if (typeof field === "string") {
      return `${formatFieldName(field)} already exists`;
    }

    const message = error.message ?? "";
    const fieldMatch =
      message.match(/fields?:\s*\(([^)]+)\)/i) ??
      message.match(/constraint:\s*`?([^`\n]+)`?/i);

    if (fieldMatch?.[1]) {
      return `${formatFieldName(fieldMatch[1])} already exists`;
    }

    return "Record already exists";
  } else {
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
}

// Round number to 2 decimal places
export function round2(value: number | string) {
  if (typeof value === "number") {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === "string") {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error("Value is not a number or string");
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 2,
});

// Format currency
export function formatCurrency(amount: number | string | null) {
  if (typeof amount === "number") {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === "string") {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else {
    return "Nan";
  }
}
