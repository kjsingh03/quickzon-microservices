import { UserModel, FollowModel, } from '../models/index.js';
import mongoose from 'mongoose';

class UserService {
  async getUsersByIds(ids: readonly string[]) {
    const users = await UserModel.find({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
    }).lean(); // 🔥 IMPORTANT

    return users.map(u => ({
      _id: u._id.toString(),
      username: u.username,
      name: u.name,
      avatar: u.avatar,
    }));
  }

  async getFollowerCount(userId: string) {
    return FollowModel.countDocuments({
      followingId: new mongoose.Types.ObjectId(userId),
    });
  }

  async getFollowingCount(userId: string) {
    return FollowModel.countDocuments({
      followerId: new mongoose.Types.ObjectId(userId),
    });
  }

  async isFollowing(viewerId: string, targetId: string) {
    const rel = await FollowModel.exists({
      followerId: new mongoose.Types.ObjectId(viewerId),
      followingId: new mongoose.Types.ObjectId(targetId),
    });

    return !!rel;
  }
}

export const userService = new UserService();