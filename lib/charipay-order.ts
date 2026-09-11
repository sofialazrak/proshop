import { prisma } from "@/db/prisma";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ChariPayReturnSearchParams = {
  ORDER_ID?: string;
  REFERENCE_ID?: string;
  TRACK_ID?: string;
  RESPONSE_CODE?: string;
  REASON_CODE?: string;
  OPERATION?: string;
  orderId?: string;
  referenceId?: string;
  trackId?: string;
  responseCode?: string;
  reasonCode?: string;
  operation?: string;
};

export function getChariPayReturnCandidates(
  searchParams: ChariPayReturnSearchParams,
) {
  return [
    searchParams.orderId,
    searchParams.ORDER_ID,
    searchParams.referenceId,
    searchParams.REFERENCE_ID,
    searchParams.trackId,
    searchParams.TRACK_ID,
  ].filter(Boolean) as string[];
}

export function isChariPayFailedReturn(
  searchParams: ChariPayReturnSearchParams,
) {
  const responseCode = searchParams.responseCode || searchParams.RESPONSE_CODE;
  const reasonCode = searchParams.reasonCode || searchParams.REASON_CODE;

  return (
    (responseCode ? responseCode !== "00" && responseCode !== "0" : false) ||
    reasonCode?.toLowerCase().includes("rejected") ||
    reasonCode?.toLowerCase().includes("failed")
  );
}

export async function findChariPayOrderId(
  candidates: string[],
  options: { attempts?: number; delayMs?: number } = {},
) {
  const { attempts = 1, delayMs = 0 } = options;

  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const candidate of candidates) {
      if (UUID_REGEX.test(candidate)) {
        const order = await prisma.order.findFirst({
          where: {
            id: candidate,
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
            equals: candidate,
          },
        },
      });

      if (order) return order.id;
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
