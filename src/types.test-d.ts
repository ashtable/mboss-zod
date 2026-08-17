/**
 * Compile-time contract for the inferred types. `tsc --noEmit` (part of `npm run lint`) is the
 * assertion: every `@ts-expect-error` below fails the build if the error it expects disappears.
 */
import type {
  BroadcastStatus,
  DeliveryStatus,
  ManageActionResponse,
  SubscriberSource,
  SubscriberStatus,
  WaitlistSignupRequest,
  WaitlistSignupResponse,
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

// @ts-expect-error 'waiting' was an invite-gate status; it is not a SubscriberStatus member
const badStatus: SubscriberStatus = 'waiting';
// @ts-expect-error 'github' was an IdentitySource member; SubscriberSource has no such member
const badSource: SubscriberSource = 'github';
// @ts-expect-error the queue rank is no longer part of the signup response
const badPosition: WaitlistSignupResponse['position'] = 214;
// @ts-expect-error subscribedAt is a string, not a Date
const badDate: WaitlistSignupResponse['subscribedAt'] = new Date();

export type {};
void [
  status,
  source,
  broadcastStatus,
  deliveryStatus,
  request,
  response,
  action,
  badStatus,
  badSource,
  badPosition,
  badDate,
];
