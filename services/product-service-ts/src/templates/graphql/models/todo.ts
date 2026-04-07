import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
  title: string;
  description?: string;
  completed: boolean;
  userId: mongoose.Types.ObjectId;
}

const TodoSchema = new Schema<ITodo>({
  title:       { type: String, required: true },
  description: { type: String },
  completed:   { type: Boolean, default: false },
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Todo = mongoose.model<ITodo>('Todo', TodoSchema);