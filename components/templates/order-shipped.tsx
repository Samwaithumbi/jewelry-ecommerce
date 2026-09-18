import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface OrderShippedProps {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
  estimatedDelivery: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

export function OrderShippedEmail({
  customerName,
  orderNumber,
  trackingNumber,
  carrier,
  trackingUrl,
  estimatedDelivery,
  items,
}: OrderShippedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been shipped! Track your package</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✨ Luxe Jewelry</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Your Order is on the Way! 🚚</Heading>
            <Text style={text}>
              Great news, {customerName}!
            </Text>
            <Text style={text}>
              Your order <strong>#{orderNumber}</strong> has been shipped and is now making its way to you.
            </Text>

            {/* Tracking Info */}
            <Section style={trackingSection}>
              <Heading style={sectionHeading}>Tracking Information</Heading>
              
              <Section style={trackingRow}>
                <Text style={trackingLabel}>Carrier:</Text>
                <Text style={trackingValue}>{carrier}</Text>
              </Section>
              
              <Section style={trackingRow}>
                <Text style={trackingLabel}>Tracking Number:</Text>
                <Text style={trackingValue}>{trackingNumber}</Text>
              </Section>
              
              <Section style={trackingRow}>
                <Text style={trackingLabel}>Estimated Delivery:</Text>
                <Text style={trackingValue}>{estimatedDelivery}</Text>
              </Section>

              <Button style={trackingButton} href={trackingUrl}>
                Track Your Package
              </Button>
            </Section>

            {/* Items Preview */}
            <Section style={itemsSection}>
              <Heading style={sectionHeading}>Items in Your Order</Heading>
              {items.map((item, index) => (
                <Section key={index} style={itemRow}>
                  <Text style={itemText}>• {item.name} (Qty: {item.quantity})</Text>
                </Section>
              ))}
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button style={button} href="https://yourstore.com/account/orders">
                View Order Details
              </Button>
            </Section>

            {/* Tips */}
            <Section style={tipsSection}>
              <Heading style={sectionHeading}>Delivery Tips</Heading>
              <Text style={tipText}>
                • Keep an eye on your tracking updates
              </Text>
              <Text style={tipText}>
                • Ensure someone is available to receive the package
              </Text>
              <Text style={tipText}>
                • Check your spam folder for delivery notifications
              </Text>
            </Section>

            {/* Support */}
            <Section style={supportSection}>
              <Text style={supportText}>
                Need help? Reply to this email or contact our support team.
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

export default OrderShippedEmail;

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

const trackingSection = {
  backgroundColor: '#ecfdf5',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #10b981',
};

const sectionHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const trackingRow = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '0 0 12px',
};

const trackingLabel = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: 'bold',
};

const trackingValue = {
  color: '#1a1a1a',
  fontSize: '15px',
  fontWeight: '500',
};

const trackingButton = {
  backgroundColor: '#10b981',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold',
  padding: '12px 24px',
  textDecoration: 'none',
  borderRadius: '6px',
  display: 'inline-block',
  marginTop: '16px',
};

const itemsSection = {
  margin: '32px 0',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
};

const itemRow = {
  margin: '8px 0',
};

const itemText = {
  color: '#333333',
  fontSize: '15px',
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

const tipsSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const tipText = {
  color: '#333333',
  fontSize: '14px',
  margin: '0 0 8px',
};

const supportSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fffbeb',
  borderRadius: '8px',
  border: '1px solid #fcd34d',
};

const supportText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
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
