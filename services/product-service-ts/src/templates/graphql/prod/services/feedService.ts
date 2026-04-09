import db from "../lib/config/db/index.js";
import { getRedis } from "../lib/config/redis/index.js";


class FeedService {
  async getFeed(userId: string, first: number, after?: string) {
    const start = after ? parseInt(after) : 0;
    const end = start + first;

    const redis = getRedis();
    const postIds = await redis.zrevrange(`feed:${userId}`, start, end);

    return {
      edges: postIds.map((id, idx) => ({
        cursor: (start + idx + 1).toString(),
        node: { _id: id },
      })),
      pageInfo: {
        hasNextPage: postIds.length === first,
        endCursor: (end).toString(),
      },
    };
  }
}

export const feedService = new FeedService();