import { z } from 'zod';

/**
 * Normalizes before validating, so `  A@B.CO ` is stored and compared as `a@b.co`.
 *
 * Capped at the RFC 5321 limit of 254 octets: `z.email()` bounds neither the local part nor the
 * whole address, and an oversized value would exceed the btree limit on `User.email`'s unique
 * index, turning a public 400 into a 500.
 */
const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const WaitlistSignupRequestSchema = z.object({
  email: emailSchema,
});
export type WaitlistSignupRequest = z.infer<typeof WaitlistSignupRequestSchema>;

export const WaitlistSignupResponseSchema = z.object({
  /** Derived at query time, never stored (design-delta §2.1). */
  position: z.number().int().positive(),
  /** `User.createdAt` serialized as an ISO-8601 UTC string. */
  joinedAt: z.iso.datetime(),
});
export type WaitlistSignupResponse = z.infer<typeof WaitlistSignupResponseSchema>;
