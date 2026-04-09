// src/index.ts

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { createContext } from './graphql/context.js';
import { errorHandler } from './lib/middlewares/index.js';
import db from './lib/config/db/index.js';
import { initSocket } from './lib/config/socket/index.js';
import { typeDefs } from './graphql/schema/index.js';
import { resolvers } from './graphql/resolvers/index.js';
import { complexityPlugin, loggingPlugin, } from './graphql/plugins/index.js';

const PORT = parseInt(process.env.PORT!);
const app = express();
const server = http.createServer(app);

initSocket(server);
db();

// Apollo server — complexity plugin prevents abuse
const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [complexityPlugin, loggingPlugin],
    introspection: process.env.NODE_ENV !== 'production', // disable in prod
});

await apolloServer.start();

app.use(cors())
   .use(express.json())
   .use(express.urlencoded({ extended: true }))
   .use(cookieParser())
   .get('/health', (_, res) => res.json({ status: 'ok' }))
   .use(
       '/graphql',
       expressMiddleware(apolloServer, {
           context: createContext,  // per-request context built here
       })
   )
   .use(errorHandler);  // same error handler — GraphQL errors get caught here too

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
});