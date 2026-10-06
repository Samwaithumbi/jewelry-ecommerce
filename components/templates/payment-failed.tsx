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

interface PaymentFailedProps {
  customerName: string;
  orderNumber: string;
  failureReason: string;
  storeUrl?: string;
  orderId?: string;
}

export function PaymentFailedEmail({
  customerName,
  orderNumber,
  failureReason,
  storeUrl = 'https://yourstore.com',
  orderId,
}: PaymentFailedProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment Failed - {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>✨ Luxe Jewelry</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Payment Failed</Heading>
            <Text style={text}>
              Dear {customerName},
            </Text>
            <Text style={text}>
              We're sorry to inform you that the payment for your order <strong>#{orderNumber}</strong> could not be processed.
            </Text>

            {/* Failure Reason */}
            <Section style={alertSection}>
              <Text style={alertLabel}>Reason:</Text>
              <Text style={alertText}>{failureReason}</Text>
            </Section>

            {/* What to do */}
            <Section style={infoSection}>
              <Heading style={infoHeading}>What You Can Do:</Heading>
              <ul style={list}>
                <li style={listItem}>Try the payment again with a different method</li>
                <li style={listItem}>Ensure you have sufficient funds</li>
                <li style={listItem}>Check with your bank if the transaction was declined</li>
                <li style={listItem}>Contact our support team if the issue persists</li>
              </ul>
            </Section>

            {/* CTA */}
            <Section style={ctaSection}>
              <Button style={button} href={orderId ? `${storeUrl}/checkout?orderId=${orderId}` : `${storeUrl}/checkout`}>
                Try Again
              </Button>
            </Section>

            {/* Support Info */}
            <Section style={supportSection}>
              <Text style={supportText}>
                Need help? Contact our support team:
              </Text>
              <Link href={`mailto:support@${storeUrl.replace('https://', '')}`} style={supportLink}>
                support@{storeUrl.replace('https://', '')}
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © 2026 Luxe Jewelry. All rights reserved.
            </Text>
            <Link href={storeUrl} style={footerLink}>
              Visit our store
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentFailedEmail;

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
  color: '#dc2626',
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

const alertSection = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const alertLabel = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const alertText = {
  color: '#7f1d1d',
  fontSize: '15px',
  margin: '0',
};

const infoSection = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoHeading = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const list = {
  margin: '0',
  paddingLeft: '20px',
};

const listItem = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '24px',
  marginBottom: '8px',
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

const supportSection = {
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #bae6fd',
  textAlign: 'center' as const,
};

const supportText = {
  color: '#0369a1',
  fontSize: '14px',
  margin: '0 0 8px',
};

const supportLink = {
  color: '#0284c7',
  fontSize: '15px',
  textDecoration: 'underline',
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
