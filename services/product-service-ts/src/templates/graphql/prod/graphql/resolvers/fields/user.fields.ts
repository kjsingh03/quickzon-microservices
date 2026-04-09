// src/graphql/resolvers/fields/user.fields.ts
import { GraphQLContext } from '../../context.js';
import { UserType } from '../../../lib/types/index.js';

export const userFieldResolvers = {
  User: {
    posts: async (user: UserType, args: any, ctx: GraphQLContext) => {
      return ctx.services.postService.getPostsByUser(user._id, args);
    },

    followerCount: async (user: UserType, _: any, ctx: GraphQLContext) => {
      return ctx.services.userService.getFollowerCount(user._id);
    },

    followingCount: async (user: UserType, _: any, ctx: GraphQLContext) => {
      return ctx.services.userService.getFollowingCount(user._id);
    },

    isFollowing: async (user: UserType, _: any, ctx: GraphQLContext) => {
      if (!ctx.user) return false;
      return ctx.services.userService.isFollowing(ctx.user._id, user._id);
    },
  },
};