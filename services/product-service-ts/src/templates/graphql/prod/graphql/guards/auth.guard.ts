// src/graphql/guards/auth.guard.ts

import { GraphQLError } from 'graphql';
import { ROLE_PERMISSIONS, TPermission } from '../../lib/consts/index.js';
import { mergePermissions } from '../../lib/utils/index.js';
import { AuthUser } from '../../lib/types/index.js';

export const requireAuth = (user: AuthUser | null): AuthUser => {
    if (!user) {
        throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    return user;
};

export const requirePermission = (
    user: AuthUser | null,
    permission: TPermission | TPermission[]
): AuthUser => {
    const authedUser = requireAuth(user);

    const rolePerms: TPermission[] = [];
    for (const role of authedUser.roles ?? []) {
        rolePerms.push(...ROLE_PERMISSIONS[role]);
    }

    const perms = mergePermissions({
        rolePermissions: rolePerms,
        allow: authedUser.allow,
        deny: authedUser.deny,
    });

    const required = Array.isArray(permission) ? permission : [permission];
    const hasAll = required.every(p => perms.has(p));

    if (!hasAll) {
        throw new GraphQLError('Forbidden', {
            extensions: { code: 'FORBIDDEN', required },
        });
    }

    return authedUser;
};