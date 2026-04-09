export const postTypeDefs = `#graphql
  type Post {
    id: ID!
    content: String!
    author: User!
    likeCount: Int!
    sensitiveField: String
  }

  input CreatePostInput {
    content: String!
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
  }
`;