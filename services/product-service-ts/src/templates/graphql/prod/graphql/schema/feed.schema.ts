export const feedTypeDefs = `#graphql
  type FeedEdge {
    cursor: String!
    node: Post!
  }

  type FeedConnection {
    edges: [FeedEdge!]!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  extend type Query {
    getFeed(userId: ID!, first: Int!, after: String): FeedConnection!
  }
`;