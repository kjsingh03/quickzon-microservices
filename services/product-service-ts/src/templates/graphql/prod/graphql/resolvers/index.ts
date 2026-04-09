// src/graphql/resolvers/index.ts
import { mergeResolvers } from '@graphql-tools/merge';

import { feedQueryResolvers } from './query/feed.query.js';
import { postMutationResolvers } from './mutation/post.mutation.js';
import { postFieldResolvers } from './fields/post.fields.js';
import { userFieldResolvers } from './fields/user.fields.js';

export const resolvers = mergeResolvers([
  feedQueryResolvers,
  postMutationResolvers,
  postFieldResolvers,
  userFieldResolvers,
]);