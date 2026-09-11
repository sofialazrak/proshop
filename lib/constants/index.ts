export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prostore";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  "A modern ecommerce store built with Next.js";
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;
export const signInDefaultValues = {
  email: "",
  password: "",
};
export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};
export const shippingAddressDefaultValues = {
  fullName: "",
  phone: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};
export const billingAddressDefaultValues = {
  type: "individual" as const,
  fullName: "",
  companyName: "",
  ice: "",
  phone: "",
  email: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};
export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(",").map((method) => method.trim())
  : ["Paypal", "Stripe", "CashOnDelivery", "ChariPay"];

export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || "Paypal";

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 8;

export const productDefaultValues = {
  name: "",
  slug: "",
  category: "",
  images: [],
  brand: "",
  description: "",
  price: "0",
  stock: 0,
  rating: "0",
  numReviews: "0",
  isFeatured: false,
  banner: null,
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(",").map((role) => role.trim())
  : ["admin", "user"];

export const reviewFormDefaultValues = {
  title: "",
  description: "",
  rating: 0,
};

export const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";

export const STORE_LEGAL = {
  name: process.env.STORE_LEGAL_NAME || APP_NAME,
  address: process.env.STORE_LEGAL_ADDRESS || "My Prostore Legal Address",
  city: process.env.STORE_LEGAL_CITY || "Casablanca",
  postalCode: process.env.STORE_LEGAL_POSTAL_CODE || "20000",
  country: process.env.STORE_LEGAL_COUNTRY || "Morocco",
  email: process.env.STORE_LEGAL_EMAIL || SENDER_EMAIL,
  phone: process.env.STORE_LEGAL_PHONE || "+212 661 000 000",
  ice: process.env.STORE_LEGAL_ICE || "ICE643786387633",
  taxId: process.env.STORE_LEGAL_TAX_ID || "TVA123456",
  rc: process.env.STORE_LEGAL_RC || "RC123456789",
};
