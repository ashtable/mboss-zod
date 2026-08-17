import { z } from 'zod';

import { BroadcastStatusSchema, SubscriberStatusSchema } from './enums.js';
import { emailSchema } from './waitlist.js';

const countSchema = z.number().int().nonnegative();

/**
 * The two text fields of a broadcast,
 * shared by the create and test-send
 * bodies.
 */
const subjectSchema = z.string().trim().min(1).max(200);
const bodyMarkdownSchema = z.string().trim().min(1).max(20_000);

/**
 * `POST /v1/admin/broadcasts`.
 *
 * `audience` is an array rather than a
 * single status because a broadcast
 * goes to subscribers and, optionally,
 * to paused subscribers as well. The
 * teaser image is a URL the admin
 * supplies, not an upload — there is
 * no asset pipeline here to receive
 * one.
 */
export const CreateBroadcastRequestSchema = z.object({
  subject: subjectSchema,
  bodyMarkdown: bodyMarkdownSchema,
  audience: z.array(SubscriberStatusSchema).nonempty(),
  teaserImageUrl: z.url().optional(),
});
export type CreateBroadcastRequest = z.infer<
  typeof CreateBroadcastRequestSchema
>;

/**
 * What `POST /v1/admin/broadcasts`
 * returns: the new broadcast's id and
 * its status.
 */
export const BroadcastResponseSchema = z.object({
  id: z.string(),
  status: BroadcastStatusSchema,
});
export type BroadcastResponse = z.infer<typeof BroadcastResponseSchema>;

/**
 * `POST /v1/admin/broadcasts/test` —
 * send this draft to one address
 * before committing to it.
 */
export const TestSendRequestSchema = z.object({
  subject: subjectSchema,
  bodyMarkdown: bodyMarkdownSchema,
  teaserImageUrl: z.url().optional(),
  to: emailSchema,
});
export type TestSendRequest = z.infer<typeof TestSendRequestSchema>;

/**
 * The test send is enqueued on the
 * `email` queue, never sent inline —
 * hence the literal.
 */
export const TestSendResponseSchema = z.object({ enqueued: z.literal(true) });
export type TestSendResponse = z.infer<typeof TestSendResponseSchema>;

/**
 * One row of `GET /v1/admin/broadcasts`.
 * `recipientCount` is nullable because
 * it is set atomically with the pending
 * delivery rows, so a draft that has
 * not been sent yet has none. The two
 * counts beside it are derived from
 * those delivery rows.
 */
export const BroadcastListRowSchema = z.object({
  id: z.string(),
  subject: z.string(),
  status: BroadcastStatusSchema,
  recipientCount: countSchema.nullable(),
  sentCount: countSchema,
  failedCount: countSchema,
  createdAt: z.iso.datetime(),
  createdBy: z.email(),
});
export type BroadcastListRow = z.infer<typeof BroadcastListRowSchema>;

/**
 * `GET /v1/admin/broadcasts` — every
 * broadcast the admin console lists.
 */
export const BroadcastListResponseSchema = z.object({
  rows: z.array(BroadcastListRowSchema),
});
export type BroadcastListResponse = z.infer<typeof BroadcastListResponseSchema>;

/**
 * Delivery totals by status — one
 * count per `DeliveryStatus` member.
 */
export const DeliveryCountsSchema = z.object({
  pending: countSchema,
  sent: countSchema,
  failed: countSchema,
  skipped: countSchema,
});
export type DeliveryCounts = z.infer<typeof DeliveryCountsSchema>;

/**
 * `GET /v1/admin/broadcasts/:id` — the
 * full broadcast plus its delivery
 * counts by status.
 */
export const BroadcastDetailResponseSchema = z.object({
  id: z.string(),
  subject: z.string(),
  bodyMarkdown: z.string(),
  audience: z.array(SubscriberStatusSchema).nonempty(),
  teaserImageUrl: z.url().nullable(),
  status: BroadcastStatusSchema,
  createdBy: z.email(),
  recipientCount: countSchema.nullable(),
  createdAt: z.iso.datetime(),
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  deliveryCounts: DeliveryCountsSchema,
});
export type BroadcastDetailResponse = z.infer<
  typeof BroadcastDetailResponseSchema
>;
