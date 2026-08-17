import { z } from 'zod';

/**
 * Zod mirrors of the Prisma enums in `mboss-database/prisma/schema.prisma`.
 * `mboss-zod` is the wire and must not depend on `mboss-database`, so these lists are maintained
 * by hand; `mboss-nodejs-api` is the only place both exist and is where a test asserts they match.
 */
export const SubscriberStatusSchema = z.enum(['subscribed', 'paused', 'unsubscribed', 'bounced']);
export type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>;

export const SubscriberSourceSchema = z.enum(['email', 'admin']);
export type SubscriberSource = z.infer<typeof SubscriberSourceSchema>;

export const BroadcastStatusSchema = z.enum(['draft', 'sending', 'sent', 'failed']);
export type BroadcastStatus = z.infer<typeof BroadcastStatusSchema>;

export const DeliveryStatusSchema = z.enum(['pending', 'sent', 'failed', 'skipped']);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;
