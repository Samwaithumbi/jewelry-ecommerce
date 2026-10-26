
export interface EnvValidationReport {
  valid: boolean;
  missingMandatory: string[];
  missingOptional: string[];
}

export const MANDATORY_ENV_VARS = [
  'DATABASE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXTAUTH_SECRET',
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
  'MPESA_ENV',
] as const;

export const OPTIONAL_INTEGRATION_VARS = [
  'CRON_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_KEY',
  'S3_ENDPOINT',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

/**
 * Validates the runtime environment variables.
 * @throws Error if any mandatory variable is missing (with clean non-sensitive error message)
 */
export function validateEnv(): EnvValidationReport {
  const missingMandatory: string[] = [];
  const missingOptional: string[] = [];

  for (const varName of MANDATORY_ENV_VARS) {
    let val = process.env[varName];
    if (varName === 'MPESA_ENV' && (!val || val.trim() === '')) {
      val = process.env.MPESA_ENVIRONMENT;
    }
    if (!val || val.trim() === '') {
      missingMandatory.push(varName);
    }
  }

  for (const varName of OPTIONAL_INTEGRATION_VARS) {
    if (!process.env[varName] || process.env[varName]?.trim() === '') {
      missingOptional.push(varName);
    }
  }

  return {
    valid: missingMandatory.length === 0,
    missingMandatory,
    missingOptional,
  };
}

/**
 * Asserts mandatory environment variables are present.
 */
export function assertMandatoryEnv(): void {
  const report = validateEnv();
  if (!report.valid) {
    throw new Error(
      `Configuration Error: Missing required environment variables: ${report.missingMandatory.join(', ')}`
    );
  }
}
