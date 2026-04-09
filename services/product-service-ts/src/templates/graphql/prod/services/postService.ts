import { AppError } from '../lib/types/index.js';
import mongoose from 'mongoose';
import { CommentModel, LikeModel, PostModel } from '../models/index.js';

class PostService {
  async createPost({ content, userId }: { content: string; userId: string }) {
    const post = await PostModel.create({
      content,
      userId: new mongoose.Types.ObjectId(userId),
    });

    return {
      _id: post._id.toString(),
      content: post.content,
      userId: post.userId.toString(),
      createdAt: post.createdAt,
    };
  }

  async getPostsByIds(ids: readonly string[]) {
    const posts = await PostModel.find({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
    }).lean();

    return posts.map(p => ({
      _id: p._id.toString(),
      content: p.content,
      userId: p.userId.toString(),
      createdAt: p.createdAt,
    }));
  }

  async getLikeCounts(postIds: readonly string[]) {
    const result = await LikeModel.aggregate([
      {
        $match: {
          postId: {
            $in: postIds.map(id => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $group: {
          _id: '$postId',
          count: { $sum: 1 },
        },
      },
    ]);

    const map = new Map(result.map(r => [r._id.toString(), r.count]));

    return postIds.map(id => ({
      postId: id,
      count: map.get(id) || 0,
    }));
  }

  async getPostsByUser(userId: string, { first, after }: any) {
    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (after) {
      query._id = { $lt: new mongoose.Types.ObjectId(after) };
    }

    const posts = await PostModel.find(query)
      .sort({ _id: -1 })
      .limit(first)
      .lean();

    return posts.map(p => ({
      _id: p._id.toString(),
      content: p.content,
      userId: p.userId.toString(),
      createdAt: p.createdAt,
    }));
  }

  async getCommentCount(postId: string) {
    return CommentModel.countDocuments({
      postId: new mongoose.Types.ObjectId(postId),
    });
  }

  async isPostLiked(postId: string, userId: string) {
    return !!(await LikeModel.exists({
      postId: new mongoose.Types.ObjectId(postId),
      userId: new mongoose.Types.ObjectId(userId),
    }));
  }
}

export const postService = new PostService();