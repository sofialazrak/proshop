import { after, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/db/prisma";

type ChariPayWebhookPayload = {
  type?: string;
  event?: string;
  name?: string;
  data?: ChariPayWebhookData;
  payload?: ChariPayWebhookData;
  resource?: ChariPayWebhookData;
};

type ChariPayWebhookData = {
  id?: string;
  Id?: string;
  reference?: string;
  Reference?: string;
  status?: string;
  Status?: string;
  amount?: number | string;
  Amount?: number | string;
  pricePaid?: number | string;
  email?: string;
  Email?: string;
  customer?: {
    email?: string;
  };
  orderId?: string;
  OrderId?: string;
  order_id?: string;
  merchantOrderId?: string;
  merchant_order_id?: string;
  externalId?: string;
  ExternalId?: string;
  external_id?: string;
  CustomData?: string;
  GatewayOrderId?: string;
  GatewayReferenceId?: string;
  metadata?: {
    orderId?: string;
  };
  config?: {
    orderId?: string;
    externalId?: string;
  };
  object?: ChariPayWebhookData;
  payment?: ChariPayWebhookData;
  order?: ChariPayWebhookData;
  session?: ChariPayWebhookData;
};

const COMPLETED_EVENTS = new Set(["payment.succeeded", "order.paid"]);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_SEARCH_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

function verifyChariPaySignature({
  rawBody,
  signature,
  timestamp,
  secret,
}: {
  rawBody: string;
  signature: string;
  timestamp: string;
  secret: string;
}) {
  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const receivedSignature = signature.replace(/^sha256=/, "");

  if (expectedSignature.length !== receivedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature),
  );
}

function getEventData(payload: ChariPayWebhookPayload) {
  const data = (payload.data ??
    payload.payload ??
    payload.resource ??
    payload) as ChariPayWebhookData;
  return data.object ?? data.payment ?? data.order ?? data.session ?? data;
}

function getOrderId(data: ChariPayWebhookData) {
  return (
    data.metadata?.orderId ||
    data.order?.metadata?.orderId ||
    data.payment?.metadata?.orderId ||
    data.session?.metadata?.orderId ||
    data.config?.orderId ||
    data.config?.externalId ||
    data.order?.id ||
    data.orderId ||
    data.OrderId ||
    data.order_id ||
    data.merchantOrderId ||
    data.merchant_order_id ||
    data.externalId ||
    data.ExternalId ||
    data.external_id ||
    data.CustomData ||
    data.Reference
  );
}

function getReferenceCandidates(data: ChariPayWebhookData) {
  return [
    data.id,
    data.Id,
    data.reference,
    data.Reference,
    data.orderId,
    data.OrderId,
    data.order_id,
    data.merchantOrderId,
    data.merchant_order_id,
    data.externalId,
    data.ExternalId,
    data.external_id,
    data.CustomData,
    data.GatewayOrderId,
    data.GatewayReferenceId,
    data.order?.id,
    data.order?.reference,
    data.payment?.id,
    data.payment?.reference,
    data.session?.id,
    data.session?.reference,
  ].filter(Boolean) as string[];
}

function getInternalOrderIdCandidate(value: string) {
  if (UUID_REGEX.test(value)) return value;

  return value.match(UUID_SEARCH_REGEX)?.[0];
}

async function findInternalOrderId(data: ChariPayWebhookData) {
  const orderId = getOrderId(data);
  const internalOrderId = orderId
    ? getInternalOrderIdCandidate(orderId)
    : undefined;

  if (internalOrderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: internalOrderId,
        paymentMethod: "ChariPay",
      },
    });

    if (order) return order.id;
  }

  for (const reference of getReferenceCandidates(data)) {
    const internalReferenceOrderId = getInternalOrderIdCandidate(reference);

    if (internalReferenceOrderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: internalReferenceOrderId,
          paymentMethod: "ChariPay",
        },
      });

      if (order) return order.id;
    }

    const order = await prisma.order.findFirst({
      where: {
        paymentMethod: "ChariPay",
        paymentResult: {
          path: ["id"],
          equals: reference,
        },
      },
    });

    if (order) return order.id;
  }

  return undefined;
}

async function markChariPayOrderPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult: {
    id: string;
    status: string;
    email_address: string;
    pricePaid: string;
    provider: string;
  };
}) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      isPaid: true,
      paidAt: new Date(),
      paymentResult,
    },
  });

  return order.id;
}

async function processChariPayWebhook({
  event,
  eventType,
  data,
}: {
  event: ChariPayWebhookPayload;
  eventType: string;
  data: ChariPayWebhookData;
}) {
  const orderId = await findInternalOrderId(data);

  if (!orderId) {
    console.error("ChariPay webhook order id missing", event);
    return;
  }

  const updatedOrderId = await markChariPayOrderPaid({
    orderId,
    paymentResult: {
      id:
        data.GatewayOrderId ||
        data.id ||
        data.Id ||
        data.reference ||
        data.Reference ||
        orderId,
      status: data.status || data.Status || "COMPLETED",
      email_address: data.customer?.email || data.email || data.Email || "",
      pricePaid: String(data.amount || data.Amount || data.pricePaid || ""),
      provider: "ChariPay",
    },
  });

  console.log("ChariPay order marked as paid", {
    eventType,
    orderId: updatedOrderId,
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const webhookSecret = process.env.CHARIPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { message: "CHARIPAY_WEBHOOK_SECRET is not set" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-chari-signature");
  const timestamp = req.headers.get("x-chari-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json(
      { message: "Missing ChariPay webhook signature" },
      { status: 400 },
    );
  }

  const isValidSignature = verifyChariPaySignature({
    rawBody,
    signature,
    timestamp,
    secret: webhookSecret,
  });

  if (!isValidSignature) {
    return NextResponse.json(
      { message: "Invalid ChariPay webhook signature" },
      { status: 400 },
    );
  }

  const event = JSON.parse(rawBody) as ChariPayWebhookPayload;
  const eventType =
    req.headers.get("chari-event-type") ||
    event.type ||
    event.event ||
    event.name;
  const data = getEventData(event);

  console.log("ChariPay webhook received", {
    eventType,
    dataId: data.id,
    dataReference: data.reference,
    dataReferencePascal: data.Reference,
    dataExternalId: data.ExternalId,
    orderId: getOrderId(data),
  });

  if (!eventType || !COMPLETED_EVENTS.has(eventType)) {
    return NextResponse.json({ message: `Ignored event ${eventType}` });
  }

  after(() => {
    processChariPayWebhook({ event, eventType, data }).catch((error) => {
      console.error("ChariPay webhook processing failed", error);
    });
  });

  return NextResponse.json({ message: "Webhook received" });
}
