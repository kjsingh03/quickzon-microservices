import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs } from './templates/graphql/schemas/schema.js';
import { resolvers } from './templates/graphql/config/rersolvers.js';
import { TODOS } from './templates/graphql/data/todo.js';
import { USERS } from './templates/graphql/data/user.js';

const app = express();

type TodoType = {
    id: number;
    title: string;
    completed: boolean;
    userId: number;
};

type UserType = {
    id: number;
    name: string;
    email: string;
    website?: string;
};

const server = new ApolloServer({
    typeDefs: `
        type Todo{
            id: ID!
            title: String!
            completed: Boolean!
            userId: ID!
            user: User!
        }

        type User{
            id: String!
            name: String!
            email: String!
            website: String
        }

        type Query{
            getTodos: [Todo!]!
            getTodo(id: ID!): Todo
            getUsers: [User!]!
        }
    `,
    resolvers: {
        Todo: {
            user: (todo: TodoType): UserType => {
                return USERS.find(u => u.id === todo.userId)!;
            },
        },

        Query: {
            getTodos: async (): Promise<TodoType[]> => {
                console.log('todos called')
                return TODOS
            },
            
            getTodo: (_: unknown, { id }: { id: string }) => {
                return TODOS.find(t => t.id === Number(id))!;
            },
            
            getUsers: async (): Promise<UserType[]> => {
                console.log('users called')
                return USERS
            },
        },
    }
});

await server.start();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    '/graphql',
    expressMiddleware(server)
);

app.listen(4000, () => console.log('🚀 http://localhost:4000/graphql'));