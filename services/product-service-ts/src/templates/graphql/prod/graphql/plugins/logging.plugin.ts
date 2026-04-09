// src/graphql/plugins/logging.plugin.ts
import { ApolloServerPlugin } from '@apollo/server';

export const loggingPlugin: ApolloServerPlugin = {
  async requestDidStart(requestContext) {
    const start = Date.now();

    const query = requestContext.request.query;
    const operationName = requestContext.request.operationName;

    console.log('🟡 GraphQL Request:', {
      operationName,
      query,
    });

    return {
      async willSendResponse(ctx) {
        const duration = Date.now() - start;

        if (ctx.errors) {
          console.error('🔴 GraphQL Errors:', ctx.errors);
        }

        console.log('🟢 GraphQL Response:', {
          operationName,
          duration: `${duration}ms`,
        });
      },
    };
  },
};