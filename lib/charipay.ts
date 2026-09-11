const CHARIPAY_API_URL =
  process.env.CHARIPAY_API_URL || "https://api-psp.charipay.ma";

const CHARIPAY_API_KEY = process.env.CHARIPAY_API_KEY;
const CHARIPAY_CUSTOMER_PHONE =
  process.env.CHARIPAY_CUSTOMER_PHONE || "0600000000";

export type ChariPayPaymentSessionResponse = {
  reference?: string;
  id?: string;
  status?: string;
  checkoutUrl?: string;
  url?: string;
  redirectionURL?: string;
  data?: {
    reference?: string;
    id?: string;
    status?: string;
    checkoutUrl?: string;
    url?: string;
    redirectionURL?: string;
  };
};

async function charipayFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  if (!CHARIPAY_API_KEY) {
    throw new Error("CHARIPAY_API_KEY is not set");
  }

  const res = await fetch(`${CHARIPAY_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-CHARI-PAY-API-KEY": CHARIPAY_API_KEY,
      "C-Request-Id": crypto.randomUUID(),
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  console.log("ChariPay session response:", json);

  if (!res.ok) {
    console.error("ChariPay error", json);
    throw new Error(json?.error?.message || "ChariPay request failed");
  }

  return json;
}

export async function createChariPayPaymentSession(input: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}) {
  const [firstName = "Customer", ...lastNameParts] = input.customerName
    .trim()
    .split(/\s+/);
  const lastName = lastNameParts.join(" ") || firstName;

  const chariPayOrderId = `${input.orderId}-${crypto.randomUUID()}`;

  return charipayFetch<ChariPayPaymentSessionResponse>("/v1/payment-sessions", {
    method: "POST",
    idempotencyKey: chariPayOrderId,
    body: JSON.stringify({
      amount: input.amount,

      // Unique for ChariPay, so retry does not reuse expired session
      orderId: chariPayOrderId,

      externalId: chariPayOrderId,

      acceptUrl: input.returnUrl,
      declineUrl: input.cancelUrl,

      config: {
        orderId: chariPayOrderId,
        externalId: chariPayOrderId,
        acceptUrl: input.returnUrl,
        declineUrl: input.cancelUrl,
        notificationUrl: input.webhookUrl,

        customer: {
          name: input.customerName,
          firstName,
          lastName,
          email: input.customerEmail,
          phone: input.customerPhone || CHARIPAY_CUSTOMER_PHONE,
        },
      },
    }),
  });
}
