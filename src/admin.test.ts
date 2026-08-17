import { describe, expect, it } from 'vitest';

import {
  AdminWaitlistQuerySchema,
  AdminWaitlistResponseSchema,
  AdminWaitlistRowSchema,
  WaitlistStatsResponseSchema,
} from './admin.js';

describe('AdminWaitlistQuery', () => {
  it('applies the default page size and leaves every filter absent', () => {
    expect(AdminWaitlistQuerySchema.parse({})).toEqual({ limit: 50 });
  });

  it('coerces limit from the query string', () => {
    expect(AdminWaitlistQuerySchema.parse({ limit: '25' }).limit).toBe(25);
  });

  it.each(['0', '101', 'abc', '1.5'])('rejects limit %j', (limit) => {
    expect(AdminWaitlistQuerySchema.safeParse({ limit }).success).toBe(false);
  });

  it('normalizes a whitespace-only search box to no filter at all', () => {
    expect(AdminWaitlistQuerySchema.parse({ q: '  ' }).q).toBeUndefined();
  });

  it('trims a real search term', () => {
    expect(AdminWaitlistQuerySchema.parse({ q: ' pat ' }).q).toBe('pat');
  });

  it('rejects a status outside the enum', () => {
    expect(AdminWaitlistQuerySchema.safeParse({ status: 'waiting' }).success).toBe(false);
  });

  it('rejects an empty cursor', () => {
    expect(AdminWaitlistQuerySchema.safeParse({ cursor: '' }).success).toBe(false);
  });
});

describe('AdminWaitlistRow', () => {
  const row = {
    id: 'ckv1',
    email: 'pat@stmarks.org',
    source: 'email',
    status: 'subscribed',
    createdAt: new Date('2026-08-02T12:00:00Z').toISOString(),
    sentCount: 3,
  };

  it('accepts a fully populated subscriber row', () => {
    expect(AdminWaitlistRowSchema.parse(row)).toEqual(row);
  });

  it.each([
    ['a negative sentCount', { sentCount: -1 }],
    ['a fractional sentCount', { sentCount: 1.5 }],
    ['a non-ISO createdAt', { createdAt: 'yesterday' }],
    ['an offset-bearing createdAt', { createdAt: '2026-08-02T12:00:00+02:00' }],
    ['an unknown source', { source: 'github' }],
  ])('rejects %s', (_why, override) => {
    expect(AdminWaitlistRowSchema.safeParse({ ...row, ...override }).success).toBe(false);
  });
});

describe('AdminWaitlistResponse', () => {
  const row = {
    id: 'ckv1',
    email: 'pat@stmarks.org',
    source: 'email',
    status: 'subscribed',
    createdAt: new Date('2026-08-02T12:00:00Z').toISOString(),
    sentCount: 3,
  };

  it('accepts an empty last page with no cursor', () => {
    expect(AdminWaitlistResponseSchema.parse({ rows: [] })).toEqual({ rows: [] });
  });

  it('accepts a populated page carrying the next cursor', () => {
    const page = { rows: [row], nextCursor: 'ckv1' };
    expect(AdminWaitlistResponseSchema.parse(page)).toEqual(page);
  });
});

describe('WaitlistStatsResponse', () => {
  const stats = { all: 214, subscribed: 201, paused: 9, unsubscribed: 3, bounced: 1 };

  it('accepts a count for every status plus the aggregate', () => {
    expect(WaitlistStatsResponseSchema.parse(stats)).toEqual(stats);
  });

  it('rejects a missing count', () => {
    const missing: Partial<typeof stats> = { ...stats };
    delete missing.bounced;
    expect(WaitlistStatsResponseSchema.safeParse(missing).success).toBe(false);
  });

  it('rejects a negative count', () => {
    expect(WaitlistStatsResponseSchema.safeParse({ ...stats, paused: -1 }).success).toBe(false);
  });
});
