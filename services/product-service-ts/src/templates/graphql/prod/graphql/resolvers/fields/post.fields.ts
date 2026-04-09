// src/graphql/resolvers/fields/post.fields.ts

import { GraphQLContext } from '../../context.js';
import { PostType } from '../../../lib/types/index.js';
import { requirePermission } from '../../guards/auth.guard.js';

export const postFieldResolvers = {
    Post: {
        // This resolver is called once per post in a list
        // DataLoader batches all these calls into one DB query
        author: async (post: PostType, _: unknown, ctx: GraphQLContext) => {
            return ctx.loaders.userLoader.load(post.userId.toString());
        },

        // Likes count — also batched
        likeCount: async (post: PostType, _: unknown, ctx: GraphQLContext) => {
            return ctx.loaders.likesLoader.load(post._id.toString());
        },

        // Field-level auth — replaces your authorize() middleware
        // salary field example: only admin can see it
        // sensitiveField: async (post: PostType, _: unknown, ctx: GraphQLContext) => {
        //     requirePermission(ctx.user, 'post:sensitive:read');
        //     return post.sensitiveField;
        // },

        commentCount: async (post: PostType, _: unknown, ctx: GraphQLContext) => {
            return ctx.services.postService.getCommentCount(post._id);
        },

        isLiked: async (post: PostType, _: unknown, ctx: GraphQLContext) => {
            if (!ctx.user) return false;
            return ctx.services.postService.isPostLiked(post._id, ctx.user._id);
        },
    },
};