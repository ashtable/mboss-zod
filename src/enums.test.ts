import { describe, expect, it } from 'vitest';

import {
  IdentitySourceSchema,
  SerialKeyStatusSchema,
  UserRoleSchema,
  UserStatusSchema,
} from './enums.js';

describe.each([
  ['UserStatus', UserStatusSchema, ['waiting', 'invited', 'active', 'disabled']],
  ['IdentitySource', IdentitySourceSchema, ['email', 'github']],
  ['UserRole', UserRoleSchema, ['user', 'admin']],
  ['SerialKeyStatus', SerialKeyStatusSchema, ['active', 'revoked']],
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
