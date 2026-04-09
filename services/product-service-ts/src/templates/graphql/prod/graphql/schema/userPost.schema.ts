// src/graphql/schema/userPost.schema.ts
export const userPostTypeDefs = `#graphql
  scalar Date

  type User {
    id: ID!
    username: String!
    name: String!
    avatar: String
    bio: String

    # Relations
    posts(first: Int!, after: String): PostConnection!

    # Computed fields
    followerCount: Int!
    followingCount: Int!
    isFollowing: Boolean!
  }

  type Post {
    id: ID!
    content: String!
    media: [String!]

    author: User!

    # Engagement
    likeCount: Int!
    commentCount: Int!

    # Personalization
    isLiked: Boolean!

    createdAt: Date!
  }

  # Pagination (cursor-based — production standard)
  type PostEdge {
    cursor: String!
    node: Post!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }
`;