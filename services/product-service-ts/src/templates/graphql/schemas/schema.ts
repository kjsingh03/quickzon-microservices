export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Todo {
    id: ID!
    title: String!
    description: String
    completed: Boolean!
    userId: ID!
  }

  type Query {
    users: [User!]!
    todos(userId: ID!): [Todo!]!
    todo(id: ID!): Todo
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    createTodo(title: String!, description: String, userId: ID!): Todo!
    updateTodo(id: ID!, title: String, description: String, completed: Boolean): Todo!
    deleteTodo(id: ID!): String!
  }
`;