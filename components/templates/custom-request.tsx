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
import * as React from 'react';

interface CustomRequestEmailProps {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  budgetMin?: string;
  budgetMax?: string;
  metalPreference?: string;
  timeline?: string;
  photoUrls?: string[];
  requestId: string;
}

export const CustomRequestEmail = ({
  customerName,
  customerEmail,
  customerPhone,
  description,
  budgetMin,
  budgetMax,
  metalPreference,
  timeline,
  photoUrls,
  requestId,
}: CustomRequestEmailProps) => {
  const budgetText = budgetMin || budgetMax 
    ? `$${budgetMin || '0'} - $${budgetMax || 'TBD'}`
    : 'Not specified';

  return (
    <Html>
      <Head />
      <Preview>New Custom Jewelry Request from {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>Lumina Jewelry</Heading>
            <Text style={headerText}>New Custom Request</Text>
          </Section>

          {/* Customer Info */}
          <Section style={section}>
            <Heading style={sectionHeading}>Customer Information</Heading>
            <Text style={text}><strong>Name:</strong> {customerName}</Text>
            <Text style={text}><strong>Email:</strong> {customerEmail}</Text>
            {customerPhone && <Text style={text}><strong>Phone:</strong> {customerPhone}</Text>}
          </Section>

          {/* Request Details */}
          <Section style={section}>
            <Heading style={sectionHeading}>Request Details</Heading>
            <Text style={text}><strong>Budget:</strong> {budgetText}</Text>
            {metalPreference && <Text style={text}><strong>Metal Preference:</strong> {metalPreference}</Text>}
            {timeline && <Text style={text}><strong>Timeline:</strong> {timeline}</Text>}
          </Section>

          {/* Description */}
          <Section style={section}>
            <Heading style={sectionHeading}>Description</Heading>
            <Text style={descriptionText}>{description}</Text>
          </Section>

          {/* Photos */}
          {photoUrls && photoUrls.length > 0 && (
            <Section style={section}>
              <Heading style={sectionHeading}>Inspiration Photos</Heading>
              <div style={photoGrid}>
                {photoUrls.slice(0, 5).map((url, index) => (
                  <Img 
                    key={index} 
                    src={url} 
                    alt={`Inspiration photo ${index + 1}`}
                    style={photo}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={button} href={`https://luminajewelry.com/admin/custom-requests/${requestId}`}>
              View Request in Admin
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Request ID: {requestId}
            </Text>
            <Text style={footerText}>
              This is an automated notification. Please respond to the customer within 24-48 hours.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomRequestEmail;

const main = {
  backgroundColor: '#f9f9f9',
  fontFamily: 'Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
  paddingBottom: '24px',
  borderBottom: '1px solid #e5e5e5',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#B88E2F',
  marginBottom: '8px',
};

const headerText = {
  fontSize: '18px',
  color: '#111827',
};

const section = {
  marginBottom: '32px',
  padding: '20px',
  backgroundColor: '#FCFBF9',
  borderRadius: '8px',
};

const sectionHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '12px',
};

const text = {
  fontSize: '14px',
  color: '#374151',
  marginBottom: '8px',
  lineHeight: '1.5',
};

const descriptionText = {
  fontSize: '14px',
  color: '#374151',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
};

const photoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '12px',
  marginTop: '12px',
};

const photo = {
  width: '100%',
  borderRadius: '4px',
  objectFit: 'cover' as const,
};

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const button = {
  backgroundColor: '#111827',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const footer = {
  marginTop: '40px',
  paddingTop: '24px',
  borderTop: '1px solid #e5e5e5',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#6B7280',
  marginBottom: '8px',
};
