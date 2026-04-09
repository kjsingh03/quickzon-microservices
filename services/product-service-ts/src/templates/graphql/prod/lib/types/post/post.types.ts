// src/lib/types/post.types.ts
export type PostType = {
  _id: string;
  content: string;
  media?: string[];
  userId: string;
  createdAt: Date;
};