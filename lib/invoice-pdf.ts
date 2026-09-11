import { STORE_LEGAL } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { BillingAddress, ShippingAddress } from "@/types";

type InvoiceOrderItem = {
  name: string;
  qty: number;
  price: string | number;
};

type InvoiceOrder = {
  id: string;
  createdAt: Date;
  paidAt: Date | null;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  orderitems: InvoiceOrderItem[];
  itemsPrice: string | number;
  shippingPrice: string | number;
  taxPrice: string | number;
  totalPrice: string | number;
};

const pageWidth = 595;
const pageHeight = 842;
const margin = 48;
const footerY = 32;

const escapePdfText = (value: string) =>
  value
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const formatDate = (date: Date | null) =>
  date
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)
    : "";

const toCurrency = (value: string | number) => formatCurrency(value);

const wrapText = (text: string, maxChars: number) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
};

const buildPdf = (pageContents: string[]) => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageContents
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(" ")}] /Count ${pageContents.length} >>`,
  ];

  pageContents.forEach((content, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
    );
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

export function generateInvoicePdf(order: InvoiceOrder) {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = pageHeight - margin;

  const addPage = () => {
    if (!ops.length) return;
    footer();
    pages.push(ops.join("\n"));
    ops = [];
    y = pageHeight - margin;
  };

  const text = (
    value: string,
    x: number,
    currentY: number,
    size = 10,
    font = "F1",
  ) => {
    ops.push(
      `BT 0 0 0 rg /${font} ${size} Tf ${x} ${currentY} Td (${escapePdfText(
        value,
      )}) Tj ET`,
    );
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ops.push(`0.86 0.86 0.86 RG ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  const fillRect = (x: number, y: number, width: number, height: number) => {
    ops.push(`1 0.792 0.157 rg ${x} ${y} ${width} ${height} re f`);
  };

  const footer = () => {
    const legalLine = [
      STORE_LEGAL.ice ? `ICE: ${STORE_LEGAL.ice}` : "",
      STORE_LEGAL.taxId ? `Tax ID: ${STORE_LEGAL.taxId}` : "",
      STORE_LEGAL.rc ? `RC: ${STORE_LEGAL.rc}` : "",
    ]
      .filter(Boolean)
      .join("  ");

    line(margin, footerY + 18, pageWidth - margin, footerY + 18);
    text(legalLine, margin, footerY, 8);
  };

  const ensureSpace = (height: number) => {
    if (y - height < 76) addPage();
  };

  const sectionTitle = (value: string, x: number, currentY: number) => {
    text(value.toUpperCase(), x, currentY, 9, "F2");
  };

  const addressLines = (address: BillingAddress | ShippingAddress) => [
    "companyName" in address && address.companyName ? address.companyName : "",
    address.fullName,
    "ice" in address && address.ice ? `ICE: ${address.ice}` : "",
    "email" in address && address.email ? address.email : "",
    address.phone || "",
    address.streetAddress,
    `${address.postalCode}, ${address.city}`,
    address.country,
  ];

  const addLogo = () => {
    fillRect(margin, y - 20, 26, 26);
    text("Prostore", margin + 36, y - 11, 18, "F2");
  };

  addLogo();
  text(`Invoice #${order.id.slice(0, 8).toUpperCase()}`, 380, y + 6, 11, "F2");
  text(`Order #${order.id}`, 380, y - 10, 9);
  text(`Paid: ${formatDate(order.paidAt)}`, 380, y - 24, 9);
  text(`Payment: ${order.paymentMethod}`, 380, y - 38, 9);
  y -= 70;
  line(margin, y, pageWidth - margin, y);
  y -= 28;

  sectionTitle("Seller", margin, y);
  sectionTitle("Billed To", 220, y);
  sectionTitle("Shipped To", 390, y);
  y -= 18;

  const sellerLines = [
    STORE_LEGAL.name,
    STORE_LEGAL.address,
    `${STORE_LEGAL.postalCode}, ${STORE_LEGAL.city}`,
    STORE_LEGAL.country,
    STORE_LEGAL.email,
    STORE_LEGAL.phone,
  ].filter(Boolean);
  const billedLines = addressLines(order.billingAddress).filter(Boolean);
  const shippedLines = addressLines(order.shippingAddress).filter(Boolean);
  const maxAddressLines = Math.max(
    sellerLines.length,
    billedLines.length,
    shippedLines.length,
  );

  for (let index = 0; index < maxAddressLines; index++) {
    if (sellerLines[index]) text(sellerLines[index], margin, y, 8.5);
    if (billedLines[index]) text(billedLines[index], 220, y, 8.5);
    if (shippedLines[index]) text(shippedLines[index], 390, y, 8.5);
    y -= 13;
  }

  y -= 20;
  line(margin, y, pageWidth - margin, y);
  y -= 25;

  text("Item", margin, y, 9, "F2");
  text("Qty", 365, y, 9, "F2");
  text("Price", 425, y, 9, "F2");
  text("Total", 500, y, 9, "F2");
  y -= 12;
  line(margin, y, pageWidth - margin, y);
  y -= 18;

  order.orderitems.forEach((item) => {
    const itemTotal = Number(item.price) * item.qty;
    const lines = wrapText(item.name, 48);
    ensureSpace(lines.length * 12 + 18);

    lines.forEach((nameLine, lineIndex) => {
      text(nameLine, margin, y, 9);
      if (lineIndex === 0) {
        text(item.qty.toString(), 365, y, 9);
        text(toCurrency(item.price), 425, y, 9);
        text(toCurrency(itemTotal), 500, y, 9);
      }
      y -= 12;
    });
    y -= 8;
  });

  ensureSpace(90);
  line(340, y, pageWidth - margin, y);
  y -= 20;

  [
    ["Items", order.itemsPrice],
    ["Shipping", order.shippingPrice],
    ["Tax", order.taxPrice],
    ["Total", order.totalPrice],
  ].forEach(([label, value], index) => {
    text(
      label.toString(),
      370,
      y,
      index === 3 ? 11 : 9,
      index === 3 ? "F2" : "F1",
    );
    text(
      toCurrency(value as string | number),
      500,
      y,
      index === 3 ? 11 : 9,
      index === 3 ? "F2" : "F1",
    );
    y -= index === 2 ? 20 : 16;
  });

  y -= 10;
  text("Thank you for your order.", margin, y, 9);

  addPage();

  return buildPdf(pages);
}
