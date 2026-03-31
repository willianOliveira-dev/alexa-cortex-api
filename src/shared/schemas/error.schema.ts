import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const ValidationErrorResponseSchema = z.object({
  code: z.literal('VALIDATION_ERROR'),
  message: z.string(),
  details: z.object({
    issues: z.array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    ),
  }),
});
