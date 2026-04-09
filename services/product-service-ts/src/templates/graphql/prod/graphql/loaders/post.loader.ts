import DataLoader from 'dataloader';
import { PostType } from '../../lib/types/index.js';

type PostService = {
  getPostsByIds(ids: readonly string[]): Promise<PostType[]>;
};

export const createPostLoader = (service: PostService) => {
  return new DataLoader<string, PostType | null>(async (ids) => {
    const posts = await service.getPostsByIds(ids);
    const map = new Map(posts.map(p => [p._id.toString(), p]));
    return ids.map(id => map.get(id) ?? null);
  });
};