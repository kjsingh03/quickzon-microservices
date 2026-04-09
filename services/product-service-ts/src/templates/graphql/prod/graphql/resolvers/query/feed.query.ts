// src/graphql/resolvers/query/feed.query.ts

import { GraphQLContext } from '../../context.js';
import { requireAuth } from '../../guards/auth.guard.js';

export const feedQueryResolvers = {
    getFeed: async (
        _: unknown,
        args: { userId: string; first: number; after?: string },
        ctx: GraphQLContext
    ) => {
        requireAuth(ctx.user);
        // Same pattern as your controllers — delegate to service
        return ctx.services.feedService.getFeed(args.userId, args.first, args.after);
    },

    getUser: async (
        _: unknown,
        args: { id: string },
        ctx: GraphQLContext
    ) => {
        requireAuth(ctx.user);
        // DataLoader used here too for single-item fetches — benefits from caching
        return ctx.loaders.userLoader.load(args.id);
    },
};