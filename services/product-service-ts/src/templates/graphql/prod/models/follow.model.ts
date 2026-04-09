import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
}

const followSchema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: 'User' },
    followingId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const FollowModel = mongoose.model<IFollow>('Follow', followSchema);