import { describe, expect, it } from 'vitest';

import {
  BroadcastCompleteResponseSchema,
  ConfirmationSentResponseSchema,
  DeliveryFlipRequestSchema,
  DeliveryFlipResponseSchema,
  EmailEventsRequestSchema,
  EmailEventsResponseSchema,
  EmailEventSchema,
  EmptyBodySchema,
  InternalBroadcastResponseSchema,
  InternalRecipientSchema,
  InternalRecipientsQuerySchema,
  InternalRecipientsResponseSchema,
  InternalSubscriberResponseSchema,
} from './internal.js';

const ISO = new Date('2026-08-02T12:00:00Z').toISOString();

describe('EmptyBody', () => {
  it('accepts an empty body', () => {
    expect(EmptyBodySchema.parse({})).toEqual({});
  });

  it('strips an unknown key rather than rejecting it, so a future field is additive', () => {
    expect(EmptyBodySchema.parse({ stray: 1 })).toEqual({});
  });
});

describe('InternalBroadcastResponse', () => {
  const broadcast = {
    id: 'ckv1',
    subject: 'Progress update #3',
    bodyMarkdown: 'the canvas is alive',
    audience: ['subscribed'],
    teaserImageUrl: null,
    status: 'sending',
    recipientCount: null,
    createdAt: ISO,
  };

  it('accepts a broadcast with no teaser image and no recipient count yet', () => {
    expect(InternalBroadcastResponseSchema.parse(broadcast)).toEqual(broadcast);
  });

  it('rejects an empty audience', () => {
    expect(
      InternalBroadcastResponseSchema.safeParse({ ...broadcast, audience: [] })
        .success,
    ).toBe(false);
  });
});

describe('InternalRecipientsQuery', () => {
  it('accepts no cursor at all', () => {
    expect(InternalRecipientsQuerySchema.parse({})).toEqual({});
  });

  it('rejects an empty cursor', () => {
    expect(
      InternalRecipientsQuerySchema.safeParse({ cursor: '' }).success,
    ).toBe(false);
  });
});

describe('InternalRecipient', () => {
  const recipient = {
    subscriberId: 'ckv1',
    email: 'pat@stmarks.org',
    tokenVersion: 1,
    currentStatus: 'subscribed',
  };

  it('accepts a recipient carrying the token version and the current status', () => {
    expect(InternalRecipientSchema.parse(recipient)).toEqual(recipient);
  });

  it.each([
    ['a token version below one', { tokenVersion: 0 }],
    ['a fractional token version', { tokenVersion: 1.5 }],
    ['a malformed email', { email: 'not-an-email' }],
  ])('rejects %s', (_why, override) => {
    expect(
      InternalRecipientSchema.safeParse({ ...recipient, ...override }).success,
    ).toBe(false);
  });
});

describe('InternalRecipientsResponse', () => {
  const recipient = {
    subscriberId: 'ckv1',
    email: 'pat@stmarks.org',
    tokenVersion: 1,
    currentStatus: 'subscribed',
  };

  it('accepts a last page with no cursor', () => {
    expect(
      InternalRecipientsResponseSchema.parse({ rows: [recipient] }),
    ).toEqual({
      rows: [recipient],
    });
  });

  it('accepts a page carrying the next cursor', () => {
    const page = { rows: [recipient], nextCursor: 'ckv2' };
    expect(InternalRecipientsResponseSchema.parse(page)).toEqual(page);
  });
});

describe('DeliveryFlipRequest', () => {
  const flip = { subscriberId: 'ckv1', status: 'sent' };

  it.each(['sent', 'failed', 'skipped'])('accepts a flip to %s', (status) => {
    expect(DeliveryFlipRequestSchema.parse({ ...flip, status }).status).toBe(
      status,
    );
  });

  it('rejects a flip back to pending, which is never something a worker asks for', () => {
    expect(
      DeliveryFlipRequestSchema.safeParse({ ...flip, status: 'pending' })
        .success,
    ).toBe(false);
  });

  it('accepts an optional error message', () => {
    expect(
      DeliveryFlipRequestSchema.parse({ ...flip, error: 'bounced' }).error,
    ).toBe('bounced');
  });

  it('rejects an error message over 2000 characters', () => {
    expect(
      DeliveryFlipRequestSchema.safeParse({ ...flip, error: 'a'.repeat(2001) })
        .success,
    ).toBe(false);
  });

  it('rejects an empty subscriberId', () => {
    expect(
      DeliveryFlipRequestSchema.safeParse({ ...flip, subscriberId: '' })
        .success,
    ).toBe(false);
  });
});

describe('DeliveryFlipResponse', () => {
  it.each(['pending', 'sent', 'failed', 'skipped'])(
    'reports the resulting status %s',
    (status) => {
      expect(DeliveryFlipResponseSchema.parse({ status })).toEqual({ status });
    },
  );
});

describe('BroadcastCompleteResponse', () => {
  const complete = {
    status: 'sent',
    sentCount: 200,
    failedCount: 1,
    skippedCount: 13,
  };

  it('accepts the final status and the three delivery totals', () => {
    expect(BroadcastCompleteResponseSchema.parse(complete)).toEqual(complete);
  });

  it('rejects a missing count', () => {
    const missing: Partial<typeof complete> = { ...complete };
    delete missing.skippedCount;
    expect(BroadcastCompleteResponseSchema.safeParse(missing).success).toBe(
      false,
    );
  });
});

describe('ConfirmationSentResponse', () => {
  it('returns the timestamp the send was recorded at', () => {
    expect(
      ConfirmationSentResponseSchema.parse({ confirmationEmailSentAt: ISO }),
    ).toEqual({
      confirmationEmailSentAt: ISO,
    });
  });

  it('rejects a non-ISO timestamp', () => {
    expect(
      ConfirmationSentResponseSchema.safeParse({
        confirmationEmailSentAt: 'yesterday',
      }).success,
    ).toBe(false);
  });
});

describe('EmailEvent', () => {
  const event = {
    email: '  PAT@STMARKS.ORG ',
    event: 'bounce',
    timestamp: 1755212345,
  };

  it('lowercases and trims the address', () => {
    expect(EmailEventSchema.parse(event).email).toBe('pat@stmarks.org');
  });

  it.each(['bounce', 'spamreport'])('accepts a %s event', (name) => {
    expect(EmailEventSchema.safeParse({ ...event, event: name }).success).toBe(
      true,
    );
  });

  it.each(['delivered', 'open', 'dropped'])('rejects a %s event', (name) => {
    expect(EmailEventSchema.safeParse({ ...event, event: name }).success).toBe(
      false,
    );
  });

  it.each([-1, 1.5])('rejects the timestamp %j', (timestamp) => {
    expect(EmailEventSchema.safeParse({ ...event, timestamp }).success).toBe(
      false,
    );
  });
});

describe('EmailEventsRequest', () => {
  const event = {
    email: 'pat@stmarks.org',
    event: 'bounce',
    timestamp: 1755212345,
  };

  it('accepts a single-event batch', () => {
    expect(EmailEventsRequestSchema.parse([event])).toHaveLength(1);
  });

  it('accepts a multi-event batch', () => {
    expect(EmailEventsRequestSchema.parse([event, event])).toHaveLength(2);
  });

  it('rejects an empty batch', () => {
    expect(EmailEventsRequestSchema.safeParse([]).success).toBe(false);
  });
});

describe('EmailEventsResponse', () => {
  it('reports how many events were processed and how many bounced', () => {
    expect(
      EmailEventsResponseSchema.parse({ processed: 2, bounced: 1 }),
    ).toEqual({
      processed: 2,
      bounced: 1,
    });
  });
});

describe('InternalSubscriberResponse', () => {
  const subscriber = {
    id: 'ckv1',
    email: 'pat@stmarks.org',
    status: 'subscribed',
    tokenVersion: 1,
    confirmationEmailSentAt: null,
    createdAt: ISO,
  };

  it('accepts a subscriber who has not been sent a confirmation yet', () => {
    expect(InternalSubscriberResponseSchema.parse(subscriber)).toEqual(
      subscriber,
    );
  });

  it('accepts a subscriber who has', () => {
    const sent = { ...subscriber, confirmationEmailSentAt: ISO };
    expect(InternalSubscriberResponseSchema.parse(sent)).toEqual(sent);
  });

  it('rejects a token version below one', () => {
    expect(
      InternalSubscriberResponseSchema.safeParse({
        ...subscriber,
        tokenVersion: 0,
      }).success,
    ).toBe(false);
  });
});
