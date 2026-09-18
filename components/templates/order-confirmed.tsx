import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface OrderConfirmedProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export function OrderConfirmedEmail({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  tax,
  total,
  shippingAddress,
}: OrderConfirmedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been confirmed - {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✨ Luxe Jewelry</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Order Confirmed!</Heading>
            <Text style={text}>
              Dear {customerName},
            </Text>
            <Text style={text}>
              Thank you for your order! We're thrilled to let you know that your order <strong>#{orderNumber}</strong> has been confirmed and is now being processed.
            </Text>

            {/* Order Details */}
            <Section style={orderDetails}>
              <Text style={orderDetailLabel}>Order Number:</Text>
              <Text style={orderDetailValue}>{orderNumber}</Text>
              
              <Text style={orderDetailLabel}>Order Date:</Text>
              <Text style={orderDetailValue}>{orderDate}</Text>
              
              <Text style={orderDetailLabel}>Shipping Address:</Text>
              <Text style={orderDetailValue}>
                {shippingAddress.name}<br />
                {shippingAddress.address}<br />
                {shippingAddress.city}, {shippingAddress.postalCode}<br />
                {shippingAddress.country}
              </Text>
            </Section>

            {/* Order Items */}
            <Section style={itemsSection}>
              <Heading style={itemsHeading}>Order Items</Heading>
              {items.map((item, index) => (
                <Section key={index} style={itemRow}>
                  <Text style={itemName}>{item.name}</Text>
                  <Text style={itemQty}>Qty: {item.quantity}</Text>
                  <Text style={itemPrice}>{item.price}</Text>
                </Section>
              ))}
            </Section>

            {/* Order Summary */}
            <Section style={summarySection}>
              <Section style={summaryRow}>
                <Text style={summaryLabel}>Subtotal</Text>
                <Text style={summaryValue}>{subtotal}</Text>
              </Section>
              <Section style={summaryRow}>
                <Text style={summaryLabel}>Shipping</Text>
                <Text style={summaryValue}>{shipping}</Text>
              </Section>
              <Section style={summaryRow}>
                <Text style={summaryLabel}>Tax</Text>
                <Text style={summaryValue}>{tax}</Text>
              </Section>
              <Section style={summaryRowTotal}>
                <Text style={totalLabel}>Total</Text>
                <Text style={totalValue}>{total}</Text>
              </Section>
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button style={button} href="https://yourstore.com/account/orders">
                View Your Order
              </Button>
            </Section>

            {/* Footer Info */}
            <Section style={footerInfo}>
              <Text style={footerText}>
                You'll receive another email when your order ships with tracking information.
              </Text>
              <Text style={footerText}>
                If you have any questions, please reply to this email or contact our support team.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Luxe Jewelry. All rights reserved.
            </Text>
            <Link href="https://yourstore.com" style={footerLink}>
              Visit our store
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmedEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1a1a1a',
  padding: '24px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '32px',
};

const heading = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const orderDetails = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const orderDetailLabel = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const orderDetailValue = {
  color: '#1a1a1a',
  fontSize: '15px',
  margin: '0 0 12px',
};

const itemsSection = {
  margin: '32px 0',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
};

const itemsHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const itemRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6',
};

const itemName = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '500',
  flex: '1',
};

const itemQty = {
  color: '#666666',
  fontSize: '14px',
  textAlign: 'center' as const,
  width: '80px',
};

const itemPrice = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: 'bold',
  textAlign: 'right' as const,
  width: '100px',
};

const summarySection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const summaryRow = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '0 0 12px',
};

const summaryRowTotal = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '2px solid #1a1a1a',
};

const summaryLabel = {
  color: '#666666',
  fontSize: '14px',
};

const summaryValue = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '500',
};

const totalLabel = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: 'bold',
};

const totalValue = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '12px 32px',
  textDecoration: 'none',
  borderRadius: '6px',
  display: 'inline-block',
};

const footerInfo = {
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  border: '1px solid #fcd34d',
};

const footer = {
  backgroundColor: '#1a1a1a',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#999999',
  fontSize: '13px',
  margin: '0 0 8px',
};

const footerLink = {
  color: '#ffffff',
  fontSize: '13px',
  textDecoration: 'underline',
};
