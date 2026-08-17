import { describe, expect, it } from 'vitest';

import {
  BroadcastDetailResponseSchema,
  BroadcastListRowSchema,
  BroadcastResponseSchema,
  CreateBroadcastRequestSchema,
  TestSendRequestSchema,
  TestSendResponseSchema,
} from './broadcast.js';

describe('CreateBroadcastRequest', () => {
  const draft = {
    subject: 'Progress update #3 — the canvas is alive',
    bodyMarkdown: 'Nodes snap to the grid now, and the run drawer streams.',
    audience: ['subscribed'],
  };

  it('accepts a subject, a body and an audience', () => {
    expect(CreateBroadcastRequestSchema.parse(draft)).toEqual(draft);
  });

  it('accepts an audience of both subscribed and paused', () => {
    const both = { ...draft, audience: ['subscribed', 'paused'] };
    expect(CreateBroadcastRequestSchema.parse(both).audience).toEqual([
      'subscribed',
      'paused',
    ]);
  });

  it('rejects an empty audience', () => {
    expect(
      CreateBroadcastRequestSchema.safeParse({ ...draft, audience: [] })
        .success,
    ).toBe(false);
  });

  it('rejects an audience member outside the subscriber statuses', () => {
    expect(
      CreateBroadcastRequestSchema.safeParse({
        ...draft,
        audience: ['waiting'],
      }).success,
    ).toBe(false);
  });

  it('trims the subject and the body', () => {
    const padded = { ...draft, subject: '  Hello  ', bodyMarkdown: '  Body  ' };
    expect(CreateBroadcastRequestSchema.parse(padded)).toMatchObject({
      subject: 'Hello',
      bodyMarkdown: 'Body',
    });
  });

  it.each([
    ['a subject that is only whitespace', { subject: '   ' }],
    ['a body that is only whitespace', { bodyMarkdown: '   ' }],
  ])('rejects %s', (_why, override) => {
    expect(
      CreateBroadcastRequestSchema.safeParse({ ...draft, ...override }).success,
    ).toBe(false);
  });

  it('accepts a 200-character subject and rejects 201', () => {
    expect(
      CreateBroadcastRequestSchema.safeParse({
        ...draft,
        subject: 'a'.repeat(200),
      }).success,
    ).toBe(true);
    expect(
      CreateBroadcastRequestSchema.safeParse({
        ...draft,
        subject: 'a'.repeat(201),
      }).success,
    ).toBe(false);
  });

  it('accepts a 20 000-character body and rejects 20 001', () => {
    expect(
      CreateBroadcastRequestSchema.safeParse({
        ...draft,
        bodyMarkdown: 'a'.repeat(20_000),
      }).success,
    ).toBe(true);
    expect(
      CreateBroadcastRequestSchema.safeParse({
        ...draft,
        bodyMarkdown: 'a'.repeat(20_001),
      }).success,
    ).toBe(false);
  });

  it('accepts a teaser image URL and rejects a non-URL', () => {
    const withTeaser = {
      ...draft,
      teaserImageUrl: 'https://mboss.dev/teaser.png',
    };
    expect(CreateBroadcastRequestSchema.parse(withTeaser).teaserImageUrl).toBe(
      'https://mboss.dev/teaser.png',
    );
    expect(
      CreateBroadcastRequestSchema.safeParse({
        ...draft,
        teaserImageUrl: 'not-a-url',
      }).success,
    ).toBe(false);
  });
});

describe('BroadcastResponse', () => {
  it('carries the new broadcast id and status', () => {
    expect(
      BroadcastResponseSchema.parse({ id: 'ckv1', status: 'sending' }),
    ).toEqual({
      id: 'ckv1',
      status: 'sending',
    });
  });

  it('rejects an unknown status', () => {
    expect(
      BroadcastResponseSchema.safeParse({ id: 'ckv1', status: 'queued' })
        .success,
    ).toBe(false);
  });
});

describe('TestSendRequest', () => {
  const send = {
    subject: 'Test',
    bodyMarkdown: 'Body',
    to: '  ASH@MBOSS.DEV ',
  };

  it('lowercases and trims the recipient', () => {
    expect(TestSendRequestSchema.parse(send).to).toBe('ash@mboss.dev');
  });

  it('rejects a malformed recipient', () => {
    expect(
      TestSendRequestSchema.safeParse({ ...send, to: 'not-an-email' }).success,
    ).toBe(false);
  });

  it('rejects a recipient one character over the RFC 5321 limit', () => {
    const to = `${'a'.repeat(243)}@example.com`;
    expect(to).toHaveLength(255);
    expect(TestSendRequestSchema.safeParse({ ...send, to }).success).toBe(
      false,
    );
  });
});

describe('TestSendResponse', () => {
  it('reports the send as enqueued — it never goes out inline', () => {
    expect(TestSendResponseSchema.parse({ enqueued: true })).toEqual({
      enqueued: true,
    });
  });

  it('rejects enqueued: false', () => {
    expect(TestSendResponseSchema.safeParse({ enqueued: false }).success).toBe(
      false,
    );
  });
});

describe('BroadcastListRow', () => {
  const row = {
    id: 'ckv1',
    subject: 'Progress update #3',
    status: 'draft',
    recipientCount: null,
    sentCount: 0,
    failedCount: 0,
    createdAt: new Date('2026-08-02T12:00:00Z').toISOString(),
    createdBy: 'ash@mboss.dev',
  };

  it('accepts a null recipientCount, which a draft has until its delivery rows exist', () => {
    expect(BroadcastListRowSchema.parse(row)).toEqual(row);
  });

  it('rejects a negative recipientCount', () => {
    expect(
      BroadcastListRowSchema.safeParse({ ...row, recipientCount: -1 }).success,
    ).toBe(false);
  });

  it('rejects a non-email createdBy', () => {
    expect(
      BroadcastListRowSchema.safeParse({ ...row, createdBy: 'ash' }).success,
    ).toBe(false);
  });
});

describe('BroadcastDetailResponse', () => {
  const detail = {
    id: 'ckv1',
    subject: 'Progress update #3',
    bodyMarkdown: 'the canvas is alive',
    audience: ['subscribed'],
    teaserImageUrl: null,
    status: 'draft',
    createdBy: 'ash@mboss.dev',
    recipientCount: null,
    createdAt: new Date('2026-08-02T12:00:00Z').toISOString(),
    startedAt: null,
    completedAt: null,
    deliveryCounts: { pending: 0, sent: 0, failed: 0, skipped: 0 },
  };

  it('accepts a broadcast whose every nullable column is null', () => {
    expect(BroadcastDetailResponseSchema.parse(detail)).toEqual(detail);
  });

  it('rejects a missing deliveryCounts', () => {
    const missing: Partial<typeof detail> = { ...detail };
    delete missing.deliveryCounts;
    expect(BroadcastDetailResponseSchema.safeParse(missing).success).toBe(
      false,
    );
  });
});
