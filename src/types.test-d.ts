/**
 * Compile-time contract for the inferred types. `tsc --noEmit` (part of `npm run lint`) is the
 * assertion: every `@ts-expect-error` below fails the build if the error it expects disappears.
 */
import type {
  AdminWaitlistResponse,
  BroadcastStatus,
  CreateBroadcastRequest,
  DeliveryStatus,
  EmailEvent,
  ManageActionResponse,
  SubscriberSource,
  SubscriberStatus,
  WaitlistSignupRequest,
  WaitlistSignupResponse,
  WaitlistStatsResponse,
} from './index.js';

const status: SubscriberStatus = 'subscribed';
const source: SubscriberSource = 'admin';
const broadcastStatus: BroadcastStatus = 'sending';
const deliveryStatus: DeliveryStatus = 'skipped';
const request: WaitlistSignupRequest = { email: 'a@b.co' };
const response: WaitlistSignupResponse = {
  email: 'a@b.co',
  status: 'subscribed',
  subscribedAt: '2026-08-10T12:00:00.000Z',
};
const action: ManageActionResponse = { status: 'paused' };
const stats: WaitlistStatsResponse = {
  all: 214,
  subscribed: 201,
  paused: 9,
  unsubscribed: 3,
  bounced: 1,
};
const rows: AdminWaitlistResponse = { rows: [] };
const event: EmailEvent = { email: 'a@b.co', event: 'bounce', timestamp: 1755212345 };
const create: CreateBroadcastRequest = {
  subject: 'Progress update #3',
  bodyMarkdown: 'the canvas is alive',
  audience: ['subscribed'],
};

// @ts-expect-error 'waiting' was an invite-gate status; it is not a SubscriberStatus member
const badStatus: SubscriberStatus = 'waiting';
// @ts-expect-error 'github' was an identity source; SubscriberSource has no such member
const badSource: SubscriberSource = 'github';
// @ts-expect-error the queue rank is no longer part of the signup response
const badPosition: WaitlistSignupResponse['position'] = 214;
// @ts-expect-error subscribedAt is a string, not a Date
const badDate: WaitlistSignupResponse['subscribedAt'] = new Date();
// There is deliberately no compile-time assertion that the audience is non-empty. `.nonempty()`
// infers as a plain array here, not as `[T, ...T[]]`, so an empty literal is assignable and only
// parsing rejects it. The runtime tests are what pin that rule.
// @ts-expect-error 'delivered' is not one of the two forwarded event types
const badEvent: EmailEvent['event'] = 'delivered';

export type {};
void [
  status,
  source,
  broadcastStatus,
  deliveryStatus,
  request,
  response,
  action,
  stats,
  rows,
  event,
  create,
  badStatus,
  badSource,
  badPosition,
  badDate,
  badEvent,
];
