import { z } from 'zod';

/**
 * Validation schema for planet names
 * Ensures names are alphabetic only and within reasonable length
 */
export const planetNameSchema = z.string()
  .min(1, 'Planet name is required')
  .max(50, 'Planet name is too long')
  .regex(/^[a-zA-Z]+$/, 'Planet name must contain only letters')
  .transform(name => name.toLowerCase());

/**
 * Validation schema for moon names
 * Allows letters and spaces for multi-word moon names
 */
export const moonNameSchema = z.string()
  .min(1, 'Moon name is required')
  .max(50, 'Moon name is too long')
  .regex(/^[a-zA-Z\s]+$/, 'Moon name must contain only letters and spaces')
  .transform(name => name.trim());

/**
 * Validation schema for celestial body names (planets or moons)
 */
export const bodyNameSchema = z.string()
  .min(1, 'Body name is required')
  .max(50, 'Body name is too long')
  .regex(/^[a-zA-Z\s]+$/, 'Body name must contain only letters and spaces')
  .transform(name => name.trim());

/**
 * Validation schema for dates in YYYY-MM-DD format
 */
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'Invalid date')
  .refine((date) => {
    const d = new Date(date);
    const now = new Date();
    const minDate = new Date('1995-06-16'); // Hubble launch date, reasonable API limit
    return d >= minDate && d <= now;
  }, 'Date must be between 1995-06-16 and today');

/**
 * Validation schema for date ranges
 */
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, 'Start date must be before or equal to end date');

/**
 * Validation schema for NASA API query parameters
 */
export const nasaQuerySchema = z.object({
  date: dateSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  count: z.number().int().min(1).max(100).optional(),
}).refine((data) => {
  // Either single date or date range, not both
  const hasDate = !!data.date;
  const hasRange = !!(data.startDate || data.endDate);
  return !(hasDate && hasRange);
}, 'Cannot specify both date and date range');

/**
 * Validation schema for rover names
 */
export const roverNameSchema = z.enum(['curiosity', 'opportunity', 'spirit', 'perseverance'], {
  errorMap: () => ({ message: 'Invalid rover name' })
});

/**
 * Validation schema for sol (Mars day) numbers
 */
export const solSchema = z.number()
  .int('Sol must be an integer')
  .min(0, 'Sol must be non-negative')
  .max(10000, 'Sol number is too large');

/**
 * Helper function to validate and sanitize input
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errorMessage = result.error.errors[0]?.message || 'Validation failed';
  return { success: false, error: errorMessage };
}
