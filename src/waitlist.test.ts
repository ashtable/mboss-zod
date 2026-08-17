import { describe, expect, it } from 'vitest';

import {
  ManageActionResponseSchema,
  ManageStateResponseSchema,
  WaitlistSignupRequestSchema,
  WaitlistSignupResponseSchema,
} from './waitlist.js';

describe('WaitlistSignupRequest', () => {
  it('lowercases and trims the email', () => {
    expect(WaitlistSignupRequestSchema.parse({ email: '  A@B.CO ' })).toEqual({
      email: 'a@b.co',
    });
  });

  it.each(['not-an-email', '', '   ', 'a@b', 'a b@c.co'])(
    'rejects %j',
    (email) => {
      expect(WaitlistSignupRequestSchema.safeParse({ email }).success).toBe(
        false,
      );
    },
  );

  it('rejects a non-string email', () => {
    expect(WaitlistSignupRequestSchema.safeParse({ email: 42 }).success).toBe(
      false,
    );
  });

  it('accepts an address at the RFC 5321 limit of 254 characters', () => {
    const email = `${'a'.repeat(242)}@example.com`;
    expect(email).toHaveLength(254);
    expect(WaitlistSignupRequestSchema.safeParse({ email }).success).toBe(true);
  });

  it('rejects an address one character over the limit', () => {
    const email = `${'a'.repeat(243)}@example.com`;
    expect(email).toHaveLength(255);
    expect(WaitlistSignupRequestSchema.safeParse({ email }).success).toBe(
      false,
    );
  });
});

describe.each([
  ['WaitlistSignupResponse', WaitlistSignupResponseSchema],
  ['ManageStateResponse', ManageStateResponseSchema],
] as const)('%s', (_name, schema) => {
  const valid = {
    email: 'pat@stmarks.org',
    status: 'subscribed',
    subscribedAt: new Date('2026-08-02T12:00:00Z').toISOString(),
  };

  it('accepts an email, a status and a subscribedAt timestamp', () => {
    expect(schema.parse(valid)).toEqual(valid);
  });

  it('accepts every subscriber status', () => {
    for (const status of ['subscribed', 'paused', 'unsubscribed', 'bounced']) {
      expect(schema.safeParse({ ...valid, status }).success).toBe(true);
    }
  });

  it.each([
    ['a non-ISO subscribedAt', { subscribedAt: 'yesterday' }],
    [
      'a local-offset subscribedAt',
      { subscribedAt: '2026-08-02T12:00:00+02:00' },
    ],
    ['an unknown status', { status: 'waiting' }],
    ['a malformed email', { email: 'not-an-email' }],
  ])('rejects %s', (_why, override) => {
    expect(schema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it('drops the queue rank, which is no longer part of the response', () => {
    expect(schema.parse({ ...valid, position: 214 })).not.toHaveProperty(
      'position',
    );
  });
});

describe('ManageActionResponse', () => {
  it('carries only the resulting status', () => {
    expect(ManageActionResponseSchema.parse({ status: 'paused' })).toEqual({
      status: 'paused',
    });
  });

  it('rejects an unknown status', () => {
    expect(
      ManageActionResponseSchema.safeParse({ status: 'gone' }).success,
    ).toBe(false);
  });
});
