// src/graphql/context.ts

import { Request } from 'express';
import { jwtUtils } from '../lib/utils/index.js';
import { createUserLoader, createPostLoader, createLikesLoader } from './loaders/index.js';
import { userService } from '../services/userService.js';
import { postService } from '../services/postService.js';
import { feedService } from '../services/feedService.js';
import { getRedis } from '../lib/config/redis/index.js';
import { AuthUser } from '../lib/types/index.js';

export type GraphQLContext = {
    user: AuthUser | null;
    loaders: {
        userLoader: ReturnType<typeof createUserLoader>;
        postLoader: ReturnType<typeof createPostLoader>;
        likesLoader: ReturnType<typeof createLikesLoader>;
    };
    services: {
        userService: typeof userService;
        postService: typeof postService;
        feedService: typeof feedService;
    };
    redis: ReturnType<typeof getRedis>;
};

export const createContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
    // Same token verification logic you already wrote
    let user: AuthUser | null = null;

    try {
        const payload = jwtUtils.verifyRequestToken(req, 'ACCESS');
        user = { ...payload, _id: payload.sub };
    } catch {
        // unauthenticated — context still built, resolvers check user
    }

    // NEW: one loader instance per request — critical rule
    const loaders = {
        userLoader: createUserLoader(userService),
        postLoader: createPostLoader(postService),
        likesLoader: createLikesLoader(postService),
    };

    return {
        user,
        loaders,
        services: { userService, postService, feedService },
        redis: getRedis(),
    };
};