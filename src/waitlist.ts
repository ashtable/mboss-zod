import { z } from 'zod';

import { SubscriberStatusSchema } from './enums.js';

/**
 * Normalizes before validating, so `  A@B.CO ` is stored and compared as `a@b.co`.
 *
 * Capped at the RFC 5321 limit of 254 octets: `z.email()` bounds neither the local part nor the
 * whole address, and an oversized value would exceed the btree limit on `Subscriber.email`'s
 * unique index, turning a public 400 into a 500.
 *
 * Exported on purpose: this is the one address rule for every wire surface, and the broadcast
 * test-send recipient and the inbound email events validate against this exact chain rather than a
 * copy of it. A three-clause chain whose 254 cap exists specifically to keep a bad address from
 * becoming a 500 is exactly the sort of thing that drifts once it has been duplicated.
 */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const WaitlistSignupRequestSchema = z.object({
  email: emailSchema,
});
export type WaitlistSignupRequest = z.infer<typeof WaitlistSignupRequestSchema>;

/**
 * `POST /v1/waitlist/signups`. There is no queue rank on the wire: the waitlist is a way to reach
 * people, not a line they wait in, so nothing here promises a rank or an order.
 */
export const WaitlistSignupResponseSchema = z.object({
  email: z.email(),
  status: SubscriberStatusSchema,
  /** `Subscriber.createdAt` serialized as an ISO-8601 UTC string. */
  subscribedAt: z.iso.datetime(),
});
export type WaitlistSignupResponse = z.infer<typeof WaitlistSignupResponseSchema>;

/** `GET /v1/waitlist/manage/:token` — the current state the manage page renders. */
export const ManageStateResponseSchema = z.object({
  email: z.email(),
  status: SubscriberStatusSchema,
  subscribedAt: z.iso.datetime(),
});
export type ManageStateResponse = z.infer<typeof ManageStateResponseSchema>;

/** The pause / resume / unsubscribe POSTs — each returns only the resulting status. */
export const ManageActionResponseSchema = z.object({ status: SubscriberStatusSchema });
export type ManageActionResponse = z.infer<typeof ManageActionResponseSchema>;
