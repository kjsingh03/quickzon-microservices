import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  content: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const postSchema = new Schema(
  {
    content: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PostModel = mongoose.model<IPost>('Post', postSchema);