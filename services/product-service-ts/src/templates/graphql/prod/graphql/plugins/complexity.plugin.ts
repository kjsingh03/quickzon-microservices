// src/graphql/plugins/complexity.plugin.ts

import { ApolloServerPlugin } from '@apollo/server';
import { GraphQLError } from 'graphql';

const MAX_DEPTH = 7;
const MAX_COMPLEXITY = 100;

const getDepth = (selectionSet: any, depth = 0): number => {
    if (!selectionSet?.selections) return depth;
    return Math.max(
        ...selectionSet.selections.map((s: any) =>
            getDepth(s.selectionSet, depth + 1)
        )
    );
};

export const complexityPlugin: ApolloServerPlugin = {
    requestDidStart: async () => ({
        didResolveOperation: async ({ document }) => {
            for (const def of document.definitions) {
                if (def.kind === 'OperationDefinition') {
                    const depth = getDepth(def.selectionSet);
                    if (depth > MAX_DEPTH) {
                        throw new GraphQLError(`Query depth ${depth} exceeds limit ${MAX_DEPTH}`, {
                            extensions: { code: 'QUERY_TOO_DEEP' },
                        });
                    }
                }
            }
        },
    }),
};