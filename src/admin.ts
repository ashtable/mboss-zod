import { z } from 'zod';

import { SubscriberSourceSchema, SubscriberStatusSchema } from './enums.js';

/**
 * Every count on the admin console is a
 * non-negative whole number.
 */
const countSchema = z.number().int().nonnegative();

/**
 * `GET /v1/admin/waitlist
 * ?status=&q=&cursor=&limit=`.
 *
 * Query strings arrive as text, so
 * `limit` coerces. An absent `status`
 * means "all" — that is a view over the
 * table, not a status a subscriber can
 * be in. `q` normalizes an empty or
 * whitespace-only search box to
 * `undefined` so the handler has one
 * representation of "no filter".
 */
export const AdminWaitlistQuerySchema = z.object({
  status: SubscriberStatusSchema.optional(),
  q: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((value) => (value ? value : undefined)),
  /**
   * Opaque keyset cursor minted by the
   * API — the wire never interprets it.
   */
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AdminWaitlistQuery = z.infer<typeof AdminWaitlistQuerySchema>;

/**
 * One row of the admin subscriber
 * table. `sentCount` is not a stored
 * column — the database does not track
 * it and `mboss-web` never touches
 * Postgres, so the API counting
 * delivery rows is the only place it
 * can come from. The wording the table
 * shows beside it ("skips updates" for
 * a paused subscriber, nothing for an
 * unsubscribed one) is derived from
 * `status` in the web layer.
 */
export const AdminWaitlistRowSchema = z.object({
  id: z.string(),
  email: z.email(),
  source: SubscriberSourceSchema,
  status: SubscriberStatusSchema,
  createdAt: z.iso.datetime(),
  sentCount: countSchema,
});
export type AdminWaitlistRow = z.infer<typeof AdminWaitlistRowSchema>;

/**
 * `nextCursor` is absent on the last
 * page — absent, not null: there is no
 * further page to name.
 */
export const AdminWaitlistResponseSchema = z.object({
  rows: z.array(AdminWaitlistRowSchema),
  nextCursor: z.string().optional(),
});
export type AdminWaitlistResponse = z.infer<typeof AdminWaitlistResponseSchema>;

/**
 * `GET /v1/admin/waitlist/stats` — one
 * count per status filter, plus `all`
 * across every status.
 */
export const WaitlistStatsResponseSchema = z.object({
  all: countSchema,
  subscribed: countSchema,
  paused: countSchema,
  unsubscribed: countSchema,
  bounced: countSchema,
});
export type WaitlistStatsResponse = z.infer<typeof WaitlistStatsResponseSchema>;
