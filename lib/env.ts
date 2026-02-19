/**
 * Environment variable validation
 * Ensures all required environment variables are present at build time
 */

import { z } from 'zod';

const envSchema = z.object({
  // NASA API key - required for server-side API routes (falls back to DEMO_KEY if not set)
  NASA_API_KEY: z.string().min(1).default('DEMO_KEY'),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional: Vercel environment variables (auto-populated by Vercel)
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse({
      NASA_API_KEY: process.env.NASA_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    });
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      (error as z.ZodError).issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>;
