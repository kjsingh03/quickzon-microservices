import DataLoader from 'dataloader';

type PostService = {
  getLikeCounts(postIds: readonly string[]): Promise<{ postId: string; count: number }[]>;
};

export const createLikesLoader = (service: PostService) => {
  return new DataLoader<string, number>(async (postIds) => {
    const results = await service.getLikeCounts(postIds);

    const map = new Map(results.map(r => [r.postId, r.count]));

    return postIds.map(id => map.get(id) ?? 0);
  });
};