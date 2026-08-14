import { z } from 'zod';

/**
 * Zod mirrors of the Prisma enums in `mboss-database/prisma/schema.prisma` (design-delta §2.1).
 * `mboss-zod` is the wire and must not depend on `mboss-database`, so these lists are maintained
 * by hand; `mboss-nodejs-api` is the only place both exist and is where a test asserts they match.
 */
export const UserStatusSchema = z.enum(['waiting', 'invited', 'active', 'disabled']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const IdentitySourceSchema = z.enum(['email', 'github']);
export type IdentitySource = z.infer<typeof IdentitySourceSchema>;

export const UserRoleSchema = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SerialKeyStatusSchema = z.enum(['active', 'revoked']);
export type SerialKeyStatus = z.infer<typeof SerialKeyStatusSchema>;
