import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name: string;
  avatar?: string;
}

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: String,
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);