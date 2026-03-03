import { z } from 'zod';

const envSchema = z.object({
  // Required: 32-byte hex string (64 characters)
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, {
    message: "ENCRYPTION_KEY must be a 32-byte hex string (64 characters)",
  }),
  
  // Optional: Leave empty for free API
  EXCHANGE_API_KEY: z.string().optional(),
  
  // Required for secure cron execution
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
  
  // Required for production monitoring (relaxed to optional)
  SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL").optional().or(z.literal('')),
    
  // Database URLs
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    const errorMessages = result.error.issues.map((issue) => {
      const message = `   - ${issue.path.join('.')}: ${issue.message}`;
      console.error(message);
      return message;
    }).join('\n');
    
    // Throw error to stop build
    throw new Error(`Invalid environment variables:\n${errorMessages}`);
  }

  console.log('✅ Environment variables validated successfully');
}
