// src/graphql/loaders/user.loader.ts

import DataLoader from 'dataloader';
import { UserType } from '../../lib/types/index.js';

type UserService = {
    getUsersByIds(ids: readonly string[]): Promise<UserType[]>;
};

export const createUserLoader = (service: UserService) => {
    return new DataLoader<string, UserType | null>(
        async (ids) => {
            const users = await service.getUsersByIds(ids);

            // CRITICAL: must return results in same ORDER as input ids
            // Failure to do this is the most common DataLoader bug
            const map = new Map(users.map(u => [u._id.toString(), u]));
            return ids.map(id => map.get(id) ?? null);
        },
        {
            // Cache is per-request because loader is per-request
            // This means within one GraphQL request, same user id is fetched once
            cache: true,
        }
    );
};