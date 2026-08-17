import { z } from 'zod';

import {
  BroadcastStatusSchema,
  DeliveryStatusSchema,
  SubscriberStatusSchema,
} from './enums.js';
import { emailSchema } from './waitlist.js';

const countSchema = z.number().int().nonnegative();
/**
 * A subscriber's token version starts
 * at 1 and only ever climbs.
 */
const tokenVersionSchema = z.number().int().positive();

/**
 * The bodies of the two internal POSTs
 * that take every argument from the
 * path. The empty object exists so
 * those routes validate their body
 * like every other route instead of
 * skipping validation altogether;
 * unknown keys are stripped rather
 * than rejected, so adding a field
 * later is additive.
 */
export const EmptyBodySchema = z.object({});
export type EmptyBody = z.infer<typeof EmptyBodySchema>;

/**
 * `GET /internal/v1/broadcasts/:id` —
 * what the send worker needs to render
 * the email.
 */
export const InternalBroadcastResponseSchema = z.object({
  id: z.string(),
  subject: z.string(),
  bodyMarkdown: z.string(),
  audience: z.array(SubscriberStatusSchema).nonempty(),
  teaserImageUrl: z.url().nullable(),
  status: BroadcastStatusSchema,
  recipientCount: countSchema.nullable(),
  createdAt: z.iso.datetime(),
});
export type InternalBroadcastResponse = z.infer<
  typeof InternalBroadcastResponseSchema
>;

/**
 * `GET /internal/v1/broadcasts/:id
 * /recipients ?cursor=`. Only the
 * cursor is on the wire — the page
 * size is an API-side constant, not a
 * knob the worker turns. The cursor is
 * opaque here.
 */
export const InternalRecipientsQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
});
export type InternalRecipientsQuery = z.infer<
  typeof InternalRecipientsQuerySchema
>;

/**
 * One pending delivery, joined to its
 * subscriber. `tokenVersion` lets the
 * worker mint that subscriber's manage
 * link without a second round trip,
 * and `currentStatus` lets it record a
 * delivery as skipped when someone
 * left the audience part-way through
 * the broadcast.
 */
export const InternalRecipientSchema = z.object({
  subscriberId: z.string(),
  email: z.email(),
  tokenVersion: tokenVersionSchema,
  currentStatus: SubscriberStatusSchema,
});
export type InternalRecipient = z.infer<typeof InternalRecipientSchema>;

/**
 * `nextCursor` is absent on the
 * worker's last page of recipients.
 */
export const InternalRecipientsResponseSchema = z.object({
  rows: z.array(InternalRecipientSchema),
  nextCursor: z.string().optional(),
});
export type InternalRecipientsResponse = z.infer<
  typeof InternalRecipientsResponseSchema
>;

/**
 * `POST
 * /internal/v1/broadcasts/:id/deliveries`
 * — the idempotent flip of one
 * delivery row out of pending.
 * `pending` is excluded because a flip
 * is by definition to a terminal
 * status; a worker asking to move a
 * row back to pending is a bug, not a
 * request.
 */
export const DeliveryFlipRequestSchema = z.object({
  subscriberId: z.string().min(1),
  status: DeliveryStatusSchema.exclude(['pending']),
  error: z.string().max(2000).optional(),
});
export type DeliveryFlipRequest = z.infer<typeof DeliveryFlipRequestSchema>;

/**
 * The row's status *after* the call.
 * Returning it is what makes
 * idempotency observable: a second
 * POST for an already-terminal row
 * reports the status it already had,
 * not the one that was asked for.
 * `pending` is allowed here even
 * though it cannot be requested, since
 * a row that has not been flipped yet
 * can legitimately report it.
 */
export const DeliveryFlipResponseSchema = z.object({
  status: DeliveryStatusSchema,
});
export type DeliveryFlipResponse = z.infer<typeof DeliveryFlipResponseSchema>;

/**
 * `POST
 * /internal/v1/broadcasts/:id/complete`
 * — the API counts the delivery rows
 * and marks the broadcast sent, or
 * failed only when every last delivery
 * failed.
 */
export const BroadcastCompleteResponseSchema = z.object({
  status: BroadcastStatusSchema,
  sentCount: countSchema,
  failedCount: countSchema,
  skippedCount: countSchema,
});
export type BroadcastCompleteResponse = z.infer<
  typeof BroadcastCompleteResponseSchema
>;

/**
 * `POST /internal/v1/subscribers/:id
 * /confirmation-sent`. The new
 * timestamp comes back because the
 * next resend's deduplication window
 * is measured from it.
 */
export const ConfirmationSentResponseSchema = z.object({
  confirmationEmailSentAt: z.iso.datetime(),
});
export type ConfirmationSentResponse = z.infer<
  typeof ConfirmationSentResponseSchema
>;

/**
 * The only two provider event types
 * the web layer forwards. Deliberately
 * narrow: widening this is a schema
 * change with a test behind it, not a
 * silent surprise.
 */
export const EmailEventTypeSchema = z.enum(['bounce', 'spamreport']);
export type EmailEventType = z.infer<typeof EmailEventTypeSchema>;

/**
 * `POST /internal/v1/email-events` — a
 * batch forwarded from the email
 * provider's webhook, so `timestamp`
 * is that provider's epoch seconds.
 * The API converts it when stamping
 * the subscriber's bounce time.
 */
export const EmailEventSchema = z.object({
  email: emailSchema,
  event: EmailEventTypeSchema,
  timestamp: z.number().int().nonnegative(),
});
export type EmailEvent = z.infer<typeof EmailEventSchema>;

/**
 * A webhook delivery batches events,
 * so the wire body is an array.
 */
export const EmailEventsRequestSchema = z.array(EmailEventSchema).nonempty();
export type EmailEventsRequest = z.infer<typeof EmailEventsRequestSchema>;

/**
 * `bounced` is a subset of
 * `processed`: a `spamreport` event
 * processes but does not bounce
 * anyone.
 */
export const EmailEventsResponseSchema = z.object({
  processed: countSchema,
  bounced: countSchema,
});
export type EmailEventsResponse = z.infer<typeof EmailEventsResponseSchema>;

/**
 * `GET /internal/v1/subscribers/:id`.
 * The confirmation workflow reads this
 * first: the id and token version are
 * the claims of the manage link it
 * mints, and the email is where it
 * sends.
 */
export const InternalSubscriberResponseSchema = z.object({
  id: z.string(),
  email: z.email(),
  status: SubscriberStatusSchema,
  tokenVersion: tokenVersionSchema,
  confirmationEmailSentAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type InternalSubscriberResponse = z.infer<
  typeof InternalSubscriberResponseSchema
>;
