import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import mongoose from 'mongoose';
import { typeDefs } from './schemas/schema.js';
import { resolvers } from './config/rersolvers.js';

const app = express();

const server = new ApolloServer({ typeDefs, resolvers });

await server.start();

app.use(cors());
app.use(json());
app.use('/graphql', expressMiddleware(server));

// await mongoose.connect(process.env.MONGO_URI!);
// console.log('MongoDB connected');

app.listen(4000, () => console.log('Server running at http://localhost:4000/graphql'));