import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface PasswordResetEmailProps {
  customerName?: string;
  resetUrl: string;
}

export function PasswordResetEmail({
  customerName = 'Valued Customer',
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Lumina Jewels password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>LUMINA JEWELS</Text>
            <Text style={tagline}>Account Recovery & Security</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Reset Your Password</Heading>
            <Text style={text}>
              Hello {customerName},
            </Text>
            <Text style={text}>
              We received a request to reset the password associated with your Lumina Jewels account. To choose a new password, click the button below:
            </Text>

            <Section style={ctaSection}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={disclaimer}>
              This password reset link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email; your account remains secure.
            </Text>

            <Section style={fallbackSection}>
              <Text style={fallbackText}>
                If the button above does not work, copy and paste this link into your browser:
              </Text>
              <Text style={urlText}>{resetUrl}</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              &copy; {new Date().getFullYear()} Lumina Jewels. All rights reserved.
            </Text>
            <Text style={footerText}>
              Security Notification &bull; Lumina Client Care
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordResetEmail;

const main = {
  backgroundColor: '#f6f6f4',
  fontFamily: "Georgia, 'Times New Roman', serif",
  padding: '40px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid #e8d5a0',
};

const header = {
  backgroundColor: '#141414',
  padding: '36px 24px',
  textAlign: 'center' as const,
};

const logo = {
  color: '#FAF7F2',
  fontSize: '22px',
  fontWeight: '700',
  letterSpacing: '4px',
  margin: '0',
};

const tagline = {
  color: '#c5a059',
  fontSize: '12px',
  letterSpacing: '1px',
  margin: '6px 0 0',
  textTransform: 'uppercase' as const,
};

const content = {
  padding: '36px 32px',
};

const heading = {
  color: '#1a1a1a',
  fontSize: '22px',
  fontWeight: '600',
  margin: '0 0 20px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  color: '#FAF7F2',
  fontSize: '15px',
  fontWeight: '600',
  padding: '14px 36px',
  textDecoration: 'none',
  borderRadius: '8px',
  display: 'inline-block',
  border: '1px solid #c5a059',
  letterSpacing: '0.5px',
};

const disclaimer = {
  color: '#888888',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '24px 0 16px',
  fontStyle: 'italic',
};

const fallbackSection = {
  borderTop: '1px solid #eeeeee',
  paddingTop: '16px',
  marginTop: '20px',
};

const fallbackText = {
  color: '#999999',
  fontSize: '12px',
  margin: '0 0 6px',
};

const urlText = {
  color: '#8c6b2d',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  margin: '0',
};

const footer = {
  backgroundColor: '#141414',
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#888888',
  fontSize: '12px',
  margin: '0 0 4px',
};
