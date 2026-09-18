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

interface OrderDeliveredProps {
  customerName: string;
  orderNumber: string;
  deliveryDate: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

export function OrderDeliveredEmail({
  customerName,
  orderNumber,
  deliveryDate,
  items,
}: OrderDeliveredProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been delivered!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✨ Luxe Jewelry</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Your Order Has Been Delivered! 🎉</Heading>
            <Text style={text}>
              Wonderful news, {customerName}!
            </Text>
            <Text style={text}>
              Your order <strong>#{orderNumber}</strong> was successfully delivered on {deliveryDate}.
            </Text>

            {/* Celebration Banner */}
            <Section style={celebrationSection}>
              <Text style={celebrationText}>
                We hope you love your new jewelry! Each piece has been crafted with care just for you.
              </Text>
            </Section>

            {/* Items Delivered */}
            <Section style={itemsSection}>
              <Heading style={sectionHeading}>Items Delivered</Heading>
              {items.map((item, index) => (
                <Section key={index} style={itemRow}>
                  <Text style={itemText}>✓ {item.name} (Qty: {item.quantity})</Text>
                </Section>
              ))}
            </Section>

            {/* Care Tips */}
            <Section style={tipsSection}>
              <Heading style={sectionHeading}>Jewelry Care Tips</Heading>
              <Text style={tipText}>
                • Store your jewelry in a cool, dry place
              </Text>
              <Text style={tipText}>
                • Avoid contact with perfumes and chemicals
              </Text>
              <Text style={tipText}>
                • Clean gently with a soft cloth after wearing
              </Text>
              <Text style={tipText}>
                • Remove before swimming or exercising
              </Text>
            </Section>

            {/* Review CTA */}
            <Section style={reviewSection}>
              <Text style={reviewText}>
                Love your new jewelry? Share your experience with others!
              </Text>
              <Button style={button} href="https://yourstore.com/account/orders">
                Leave a Review
              </Button>
            </Section>

            {/* Support */}
            <Section style={supportSection}>
              <Text style={supportText}>
                If you have any issues with your order, please reply to this email or contact our support team. We're here to help!
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

export default OrderDeliveredEmail;

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

const celebrationSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: '1px solid #fcd34d',
};

const celebrationText = {
  color: '#92400e',
  fontSize: '16px',
  fontStyle: 'italic',
  margin: '0',
};

const itemsSection = {
  margin: '32px 0',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
};

const sectionHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const itemRow = {
  margin: '8px 0',
};

const itemText = {
  color: '#059669',
  fontSize: '15px',
  fontWeight: '500',
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

const reviewSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #bae6fd',
};

const reviewText = {
  color: '#0369a1',
  fontSize: '15px',
  margin: '0 0 16px',
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

const supportSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fff1f2',
  borderRadius: '8px',
  border: '1px solid #fecdd3',
};

const supportText = {
  color: '#be123c',
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
