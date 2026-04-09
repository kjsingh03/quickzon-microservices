// src/graphql/schema/index.ts
import { mergeTypeDefs } from '@graphql-tools/merge';

import { userTypeDefs } from './user.schema.js';
import { postTypeDefs } from './post.schema.js';
import { feedTypeDefs } from './feed.schema.js';

export const typeDefs = mergeTypeDefs([
  userTypeDefs,
  postTypeDefs,
  feedTypeDefs,
]);