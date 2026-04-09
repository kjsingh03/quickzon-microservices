// src/graphql/resolvers/mutation/post.mutation.ts

import { GraphQLError } from 'graphql';
import { GraphQLContext } from '../../context.js';
import { requirePermission } from '../../guards/auth.guard.js';
import { AppError } from '../../../lib/types/index.js';

export const postMutationResolvers = {
    createPost: async (
        _: unknown,
        args: { input: { content: string } },
        ctx: GraphQLContext
    ) => {
        requirePermission(ctx.user, 'post:create');

        try {
            const post = await ctx.services.postService.createPost({
                content: args.input.content,
                userId: ctx.user!._id,
            });
            return post;
        } catch (err) {
            // AppError maps to GraphQL error with machine-readable code
            if (err instanceof AppError) {
                throw new GraphQLError(err.message, {
                    extensions: {
                        code: err.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
                        statusCode: err.statusCode,
                    },
                });
            }
            throw new GraphQLError('Internal server error', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    },
};