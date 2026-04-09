import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
}

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    content: String,
  },
  { timestamps: true }
);

export const CommentModel = mongoose.model<IComment>('Comment', commentSchema);