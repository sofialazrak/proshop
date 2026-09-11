import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { BillingAddress, Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import sampleData from "@/db/sample-data";
import { STORE_LEGAL } from "@/lib/constants";

PurchaseReceiptEmail.PreviewProps = {
  order: {
    id: "12345678-1234-1234-1234-123456789abc",
    userId: "123",
    user: {
      name: "John Doe",
      email: "test@test.com",
      billingAddress: null,
    },
    paymentMethod: "Stripe",
    shippingAddress: {
      fullName: "John Doe",
      phone: "0600000000",
      streetAddress: "123 Main st",
      city: "New York",
      postalCode: "10001",
      country: "US",
    },
    createdAt: new Date(),
    totalPrice: "100",
    taxPrice: "10",
    shippingPrice: "10",
    itemsPrice: "80",
    orderitems: sampleData.products.map((x) => ({
      name: x.name,
      orderId: "123",
      productId: "123",
      slug: x.slug,
      qty: x.stock,
      image: x.images[0],
      price: x.price.toString(),
    })),
    isDelivered: true,
    deliveredAt: new Date(),
    isCancelled: false,
    cancelledAt: null,
    isPaid: true,
    paidAt: new Date(),
    paymentResult: {
      id: "123",
      status: "succeeded",
      pricePaid: "100",
      email_address: "test@test.com",
    },
  },
} satisfies OrderInformationProps;

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

type OrderInformationProps = {
  order: Order;
};

export default function PurchaseReceiptEmail({ order }: OrderInformationProps) {
  const billingAddress = (order.user.billingAddress ||
    order.shippingAddress) as BillingAddress;

  return (
    <Html>
      <Preview>View order receipt</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading>Purchase Receipt</Heading>
            <Section className="border border-solid border-gray-200 rounded-lg p-4 mb-4">
              <Row>
                <Column className="w-1/2 pr-3 align-top">
                  <Text className="mb-1 text-gray-500">Seller</Text>
                  <Text className="m-0 font-bold">{STORE_LEGAL.name}</Text>
                  {[
                    STORE_LEGAL.address,
                    [STORE_LEGAL.postalCode, STORE_LEGAL.city]
                      .filter(Boolean)
                      .join(" "),
                    STORE_LEGAL.country,
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <Text key={line} className="m-0 text-sm text-gray-700">
                        {line}
                      </Text>
                    ))}
                </Column>
                <Column className="w-1/2 pl-3 align-top">
                  <Text className="mb-1 text-gray-500">Contact & Legal</Text>
                  {[
                    STORE_LEGAL.email,
                    STORE_LEGAL.phone,
                    STORE_LEGAL.ice ? `ICE: ${STORE_LEGAL.ice}` : "",
                    STORE_LEGAL.taxId ? `Tax ID: ${STORE_LEGAL.taxId}` : "",
                    STORE_LEGAL.rc ? `RC: ${STORE_LEGAL.rc}` : "",
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <Text key={line} className="m-0 text-sm text-gray-700">
                        {line}
                      </Text>
                    ))}
                </Column>
              </Row>
            </Section>
            <Section className="border border-solid border-gray-200 rounded-lg p-4 mb-4">
              <Row>
                <Column className="w-1/2 pr-3 align-top">
                  <Text className="mb-1 text-gray-500">Billed To</Text>
                  {billingAddress.type === "company" &&
                    billingAddress.companyName && (
                      <Text className="m-0 font-bold">
                        {billingAddress.companyName}
                      </Text>
                    )}
                  <Text className="m-0 font-bold">
                    {billingAddress.fullName}
                  </Text>
                  {[
                    billingAddress.ice ? `ICE: ${billingAddress.ice}` : "",
                    billingAddress.email,
                    billingAddress.phone,
                    billingAddress.streetAddress,
                    [billingAddress.postalCode, billingAddress.city]
                      .filter(Boolean)
                      .join(" "),
                    billingAddress.country,
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <Text key={line} className="m-0 text-sm text-gray-700">
                        {line}
                      </Text>
                    ))}
                </Column>
                <Column className="w-1/2 pl-3 align-top">
                  <Text className="mb-1 text-gray-500">Shipped To</Text>
                  <Text className="m-0 font-bold">
                    {order.shippingAddress.fullName}
                  </Text>
                  {[
                    order.shippingAddress.phone,
                    order.shippingAddress.streetAddress,
                    [
                      order.shippingAddress.postalCode,
                      order.shippingAddress.city,
                    ]
                      .filter(Boolean)
                      .join(" "),
                    order.shippingAddress.country,
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <Text key={line} className="m-0 text-sm text-gray-700">
                        {line}
                      </Text>
                    ))}
                </Column>
              </Row>
            </Section>
            <Section>
              <Row>
                <Column>
                  <Text className="mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap">
                    Order ID
                  </Text>
                  <Text className="mt-0 mr-4">{order.id.toString()}</Text>
                </Column>
                <Column>
                  <Text className="mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap">
                    Purchase Date
                  </Text>
                  <Text className="mt-0 mr-4">
                    {dateFormatter.format(order.createdAt)}
                  </Text>
                </Column>
                <Column>
                  <Text className="mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap">
                    Price Paid
                  </Text>
                  <Text className="mt-0 mr-4">
                    {formatCurrency(order.totalPrice)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4">
              {order.orderitems.map((item) => (
                <Row key={item.productId} className="mt-8">
                  <Column className="w-20">
                    <Img
                      width="80"
                      alt={item.name}
                      className="rounded"
                      src={
                        item.image.startsWith("/")
                          ? `${process.env.NEXT_PUBLIC_SERVER_URL}${item.image}`
                          : item.image
                      }
                    />
                  </Column>
                  <Column className="align-top">
                    {item.name} x {item.qty}
                  </Column>
                  <Column align="right" className="align-top">
                    {formatCurrency(item.price)}
                  </Column>
                </Row>
              ))}
              {[
                { name: "Items", price: order.itemsPrice },
                { name: "Tax", price: order.taxPrice },
                { name: "Shipping", price: order.shippingPrice },
                { name: "Total", price: order.totalPrice },
              ].map(({ name, price }) => (
                <Row key={name} className="py-1">
                  <Column align="right">{name}: </Column>
                  <Column align="right" width={70} className="align-top">
                    <Text className="m-0">{formatCurrency(price)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
