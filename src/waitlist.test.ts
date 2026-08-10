import { describe, expect, it } from 'vitest';

import { WaitlistSignupRequestSchema, WaitlistSignupResponseSchema } from './waitlist.js';

describe('WaitlistSignupRequest', () => {
  it('lowercases and trims the email', () => {
    expect(WaitlistSignupRequestSchema.parse({ email: '  A@B.CO ' })).toEqual({ email: 'a@b.co' });
  });

  it.each(['not-an-email', '', '   ', 'a@b', 'a b@c.co'])('rejects %j', (email) => {
    expect(WaitlistSignupRequestSchema.safeParse({ email }).success).toBe(false);
  });

  it('rejects a non-string email', () => {
    expect(WaitlistSignupRequestSchema.safeParse({ email: 42 }).success).toBe(false);
  });
});

describe('WaitlistSignupResponse', () => {
  it('accepts a positive integer position and an ISO-8601 UTC joinedAt', () => {
    const joinedAt = new Date('2026-08-10T12:00:00Z').toISOString();
    expect(WaitlistSignupResponseSchema.parse({ position: 214, joinedAt })).toEqual({
      position: 214,
      joinedAt,
    });
  });

  it.each([0, -1, 1.5])('rejects position %j', (position) => {
    const joinedAt = new Date().toISOString();
    expect(WaitlistSignupResponseSchema.safeParse({ position, joinedAt }).success).toBe(false);
  });

  it('rejects a non-ISO joinedAt', () => {
    expect(
      WaitlistSignupResponseSchema.safeParse({ position: 1, joinedAt: 'yesterday' }).success,
    ).toBe(false);
  });
});
