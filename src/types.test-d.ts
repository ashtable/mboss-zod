/**
 * Compile-time contract for the inferred types. `tsc --noEmit` (part of `npm run lint`) is the
 * assertion: every `@ts-expect-error` below fails the build if the error it expects disappears.
 */
import type {
  IdentitySource,
  SerialKeyStatus,
  UserRole,
  UserStatus,
  WaitlistSignupRequest,
  WaitlistSignupResponse,
} from './index.js';

const status: UserStatus = 'waiting';
const source: IdentitySource = 'github';
const role: UserRole = 'admin';
const keyStatus: SerialKeyStatus = 'revoked';
const request: WaitlistSignupRequest = { email: 'a@b.co' };
const response: WaitlistSignupResponse = { position: 214, joinedAt: '2026-08-10T12:00:00.000Z' };

// @ts-expect-error 'pending' is not a UserStatus member
const badStatus: UserStatus = 'pending';
// @ts-expect-error position is a number, not a string
const badPosition: WaitlistSignupResponse['position'] = '214';

export type {};
void [status, source, role, keyStatus, request, response, badStatus, badPosition];
