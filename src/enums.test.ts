import { describe, expect, it } from 'vitest';

import {
  BroadcastStatusSchema,
  DeliveryStatusSchema,
  SubscriberSourceSchema,
  SubscriberStatusSchema,
} from './enums.js';

describe.each([
  [
    'SubscriberStatus',
    SubscriberStatusSchema,
    ['subscribed', 'paused', 'unsubscribed', 'bounced'],
  ],
  ['SubscriberSource', SubscriberSourceSchema, ['email', 'admin']],
  [
    'BroadcastStatus',
    BroadcastStatusSchema,
    ['draft', 'sending', 'sent', 'failed'],
  ],
  [
    'DeliveryStatus',
    DeliveryStatusSchema,
    ['pending', 'sent', 'failed', 'skipped'],
  ],
] as const)('%s', (_name, schema, members) => {
  it('exposes exactly the Prisma enum members, in order', () => {
    expect(schema.options).toEqual(members);
  });

  it('round-trips every member', () => {
    for (const member of members) {
      expect(schema.parse(member)).toBe(member);
    }
  });

  it('rejects a value outside the enum', () => {
    expect(schema.safeParse('nope').success).toBe(false);
  });
});
