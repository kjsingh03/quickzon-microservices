# QuickZon Microservices :) — Full Repo Skeleton

## Repo tree

```text
quickzon-backend/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/0001_init/migration.sql
└── services/
    ├── graphql-api/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── Dockerfile
    │   └── src/
    │       ├── index.ts
    │       ├── context.ts
    │       ├── graphql/
    │       │   ├── typeDefs.ts
    │       │   └── resolvers.ts
    │       ├── grpc/
    │       │   ├── client.ts
    │       │   └── product.proto
    │       └── lib/
    │           ├── auth.ts
    │           ├── kafka.ts
    │           ├── permissions.ts
    │           ├── prisma.ts
    │           ├── rabbitmq.ts
    │           └── redis.ts
    ├── grpc-product/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── Dockerfile
    │   ├── proto/product.proto
    │   └── src/
    │       ├── server.ts
    │       ├── lib/
    │       │   ├── kafka.ts
    │       │   ├── prisma.ts
    │       │   └── redis.ts
    │       ├── repositories/
    │       │   └── product.repository.ts
    │       └── services/
    │           └── product.service.ts
    └── worker-service/
        ├── package.json
        ├── tsconfig.json
        ├── Dockerfile
        └── src/index.ts
```

---

## `.env.example`

```env
NODE_ENV=development
JWT_SECRET=replace-with-a-long-secret

DATABASE_URL=postgresql://quickzon:quickzon@postgres:5432/quickzon?schema=public
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:9092
KAFKA_CLIENT_ID=quickzon-backend
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

GRAPHQL_PORT=4000
GRPC_PRODUCT_PORT=50051
GRPC_PRODUCT_ADDR=grpc-product:50051
```

---

## `.gitignore`

```gitignore
.env
*.log

node_modules/
dist/
coverage/

services/**/node_modules/
services/**/dist/

myvenv/
venv/
env/

__pycache__/
**/__pycache__/
*.pyc
*.pyo
*.pyd

.DS_Store
Thumbs.db
```

---

## `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: quickzon
      POSTGRES_PASSWORD: quickzon
      POSTGRES_DB: quickzon
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U quickzon -d quickzon"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis/redis-stack:latest
    ports:
      - "6379:6379"
      - "8001:8001"
    volumes:
      - redisdata:/data

  zookeeper:
    image: bitnami/zookeeper:latest
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
    ports:
      - "2181:2181"

  kafka:
    image: bitnami/kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      - ALLOW_PLAINTEXT_LISTENER=yes
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,PLAINTEXT_HOST://:29092
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9092
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      - KAFKA_CFG_INTER_BROKER_LISTENER_NAME=PLAINTEXT
      - KAFKA_CFG_OFFSETS_TOPIC_REPLICATION_FACTOR=1
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=true

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  graphql-api:
    build:
      context: .
      dockerfile: services/graphql-api/Dockerfile
    env_file: .env
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      kafka:
        condition: service_started
      rabbitmq:
        condition: service_started
      grpc-product:
        condition: service_started

  grpc-product:
    build:
      context: .
      dockerfile: services/grpc-product/Dockerfile
    env_file: .env
    ports:
      - "50051:50051"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
      kafka:
        condition: service_started

  worker-service:
    build:
      context: .
      dockerfile: services/worker-service/Dockerfile
    env_file: .env
    depends_on:
      rabbitmq:
        condition: service_started

volumes:
  pgdata:
  redisdata:
```

---

## `README.md`

```md
# QuickZon Microservices :) — A Quick Commerce System Design

## What it does

- GraphQL for frontend/admin
- gRPC for internal service calls
- Redis for cache + sessions
- RabbitMQ for jobs
- Kafka for events
- Prisma + Postgres for source of truth
- JWT + RBAC + branch scope for auth

## First flow

1. Login with GraphQL
2. Query a product
3. GraphQL calls gRPC
4. gRPC service checks Redis
5. On cache miss, gRPC service reads Postgres via Prisma
6. gRPC service caches product in Redis
7. GraphQL publishes `product_viewed` to Kafka
8. `createProduct` queues a RabbitMQ job

## Run

```bash
docker compose up --build -d
```

## Migrate database

```bash
docker compose exec graphql-api npx prisma migrate deploy --schema /app/prisma/schema.prisma
```

## UI

- GraphQL: http://localhost:4000/graphql
- RedisInsight: http://localhost:8001
- RabbitMQ UI: http://localhost:15672
```

---

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPER_ADMIN
  BRANCH_MANAGER
  BILLING_STAFF
  INFLUENCER
}

model Branch {
  id        String    @id @default(uuid())
  name      String
  users     User[]
  products  Product[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model User {
  id          String      @id @default(uuid())
  email       String      @unique
  password    String
  role        UserRole    @default(BILLING_STAFF)
  branchId    String?
  branch      Branch?     @relation(fields: [branchId], references: [id], onDelete: SetNull)
  sessions    Session[]
  auditEvents AuditEvent[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  revoked   Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Product {
  id          String    @id @default(uuid())
  name        String
  price       Float
  branchId    String
  branch      Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
  description String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model AuditEvent {
  id        String   @id @default(uuid())
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
  eventType String
  payload   Json
  createdAt DateTime @default(now())
}
```

---

## `prisma/migrations/0001_init/migration.sql`

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BRANCH_MANAGER', 'BILLING_STAFF', 'INFLUENCER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Branch" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'BILLING_STAFF',
  "branchId" TEXT NULL REFERENCES "Branch"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "revoked" BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "branchId" TEXT NOT NULL REFERENCES "Branch"("id") ON DELETE CASCADE,
  "description" TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" TEXT NULL REFERENCES "User"("id") ON DELETE SET NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");
CREATE INDEX IF NOT EXISTS "Product_branchId_idx" ON "Product" ("branchId");
CREATE INDEX IF NOT EXISTS "AuditEvent_actorId_idx" ON "AuditEvent" ("actorId");
```

---

# services/graphql-api

## `services/graphql-api/package.json`

```json
{
  "name": "quickzon-graphql-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "prisma generate --schema ../../prisma/schema.prisma && tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate --schema ../../prisma/schema.prisma",
    "prisma:migrate": "prisma migrate deploy --schema ../../prisma/schema.prisma"
  },
  "dependencies": {
    "@apollo/server": "^4.11.3",
    "@grpc/grpc-js": "^1.12.2",
    "@grpc/proto-loader": "^0.8.0",
    "@prisma/client": "^6.16.2",
    "amqplib": "^0.10.5",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "graphql": "^16.11.0",
    "jsonwebtoken": "^9.0.2",
    "kafkajs": "^2.2.4",
    "redis": "^5.8.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^24.3.0",
    "prisma": "^6.16.2",
    "tsx": "^4.19.4",
    "typescript": "^5.9.2"
  }
}
```

## `services/graphql-api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

## `services/graphql-api/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/services/graphql-api

COPY services/graphql-api/package*.json ./
COPY services/graphql-api/tsconfig.json ./
COPY prisma /app/prisma

RUN npm install

COPY services/graphql-api ./

RUN npx prisma generate --schema /app/prisma/schema.prisma
RUN npm run build

FROM node:20-alpine

WORKDIR /app/services/graphql-api

COPY --from=builder /app/services/graphql-api/node_modules ./node_modules
COPY --from=builder /app/services/graphql-api/dist ./dist
COPY --from=builder /app/prisma /app/prisma
COPY services/graphql-api/package*.json ./

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema /app/prisma/schema.prisma && node dist/index.js"]
```

## `services/graphql-api/src/lib/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

## `services/graphql-api/src/lib/redis.ts`

```ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
export const redis = createClient({ url: redisUrl });

redis.on("error", (error) => console.error("[redis]", error));

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
}
```

## `services/graphql-api/src/lib/permissions.ts`

```ts
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  BRANCH_MANAGER = "BRANCH_MANAGER",
  BILLING_STAFF = "BILLING_STAFF",
  INFLUENCER = "INFLUENCER",
}

export type Permission =
  | "*"
  | "branch:create" | "branch:read" | "branch:update" | "branch:delete"
  | "product:create" | "product:read" | "product:update" | "product:delete" | "product:price:override"
  | "bill:create" | "bill:read" | "bill:cancel" | "bill:return"
  | "inventory:manage" | "inventory:transfer" | "inventory:adjust"
  | "staff:manage" | "incentive:view" | "incentive:manage"
  | "report:branch" | "report:system" | "report:staff"
  | "wallet:configure" | "wallet:adjust"
  | "notification:send" | "notification:analytics"
  | "influencer:manage" | "influencer:self:view";

export type AuthUser = {
  userId: string;
  role: UserRole;
  branchId?: string | null;
  permissions: Permission[];
  sessionId: string;
  iat: number;
  exp: number;
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ["*"],
  BRANCH_MANAGER: [
    "product:read", "product:create", "product:update",
    "bill:read", "bill:cancel", "bill:return",
    "inventory:manage", "inventory:transfer",
    "staff:manage", "incentive:view",
    "report:branch", "report:staff",
    "influencer:manage",
  ],
  BILLING_STAFF: ["product:read", "bill:create", "bill:read"],
  INFLUENCER: ["influencer:self:view"],
};

export function expandPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(user: AuthUser | null | undefined, required: Permission): boolean {
  return !!user && (user.permissions.includes("*") || user.permissions.includes(required));
}

export function assertBranchScope(user: AuthUser, branchId?: string | null) {
  if (user.role === UserRole.SUPER_ADMIN) return;
  if (!branchId || user.branchId !== branchId) throw new Error("Access outside your branch");
}
```

## `services/graphql-api/src/lib/auth.ts`

```ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "./prisma.js";
import { expandPermissions, type AuthUser, type UserRole } from "./permissions.js";
import { redis } from "./redis.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "replace-me";

export async function issueSessionToken(user: { id: string; role: UserRole; branchId: string | null }) {
  const sessionId = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const payload: AuthUser = {
    userId: user.id,
    role: user.role,
    branchId: user.branchId,
    permissions: expandPermissions(user.role),
    sessionId,
    iat: now,
    exp: now + 60 * 60 * 24,
  };

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      revoked: false,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await redis.set(`session:${sessionId}`, JSON.stringify(payload), { EX: 60 * 60 * 24 });

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
  return { token, payload };
}

export async function verifyBearerToken(headerValue?: string | null): Promise<AuthUser | null> {
  if (!headerValue) return null;
  const token = headerValue.startsWith("Bearer ") ? headerValue.slice(7) : headerValue;
  const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

  const key = `session:${decoded.sessionId}`;
  const exists = await redis.exists(key);

  if (!exists) {
    const session = await prisma.session.findUnique({ where: { id: decoded.sessionId } });
    if (!session || session.revoked) return null;
    await redis.set(key, JSON.stringify(decoded), { EX: 60 * 60 * 24 });
  }

  return decoded;
}

export async function loginWithEmailPassword(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  return issueSessionToken(user);
}
```

## `services/graphql-api/src/lib/kafka.ts`

```ts
import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID ?? "quickzon-backend", brokers });
const producer = kafka.producer();
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
}

export async function publishEvent(topic: string, value: unknown) {
  await ensureConnected();
  await producer.send({ topic, messages: [{ value: JSON.stringify(value) }] });
}
```

## `services/graphql-api/src/lib/rabbitmq.ts`

```ts
import amqp from "amqplib";

const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
let channel: amqp.Channel | null = null;

async function getChannel() {
  if (channel) return channel;
  const connection = await amqp.connect(url);
  channel = await connection.createChannel();
  return channel;
}

export async function enqueueJob(queue: string, payload: unknown) {
  const ch = await getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
}
```

## `services/graphql-api/src/grpc/product.proto`

```proto
syntax = "proto3";

package quickzon;

service ProductService {
  rpc GetProduct (ProductByIdRequest) returns (ProductResponse);
  rpc CreateProduct (CreateProductRequest) returns (ProductResponse);
  rpc UpdateProduct (UpdateProductRequest) returns (ProductResponse);
  rpc DeleteProduct (ProductByIdRequest) returns (DeleteProductResponse);
  rpc OverridePrice (OverridePriceRequest) returns (ProductResponse);
}

message ProductByIdRequest {
  string id = 1;
}

message CreateProductRequest {
  string name = 1;
  double price = 2;
  string branchId = 3;
  string description = 4;
}

message UpdateProductRequest {
  string id = 1;
  string name = 2;
  double price = 3;
  string branchId = 4;
  string description = 5;
}

message OverridePriceRequest {
  string id = 1;
  double price = 2;
}

message ProductResponse {
  string id = 1;
  string name = 2;
  double price = 3;
  string branchId = 4;
  string description = 5;
  string createdAt = 6;
  string updatedAt = 7;
}

message DeleteProductResponse {
  bool success = 1;
}
```

## `services/graphql-api/src/grpc/client.ts`

```ts
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const addr = process.env.GRPC_PRODUCT_ADDR ?? "localhost:50051";
const packageDef = protoLoader.loadSync(new URL("./product.proto", import.meta.url).pathname, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const loaded = grpc.loadPackageDefinition(packageDef) as any;
const ProductService = loaded.quickzon.ProductService;
const client = new ProductService(addr, grpc.credentials.createInsecure());

function call(method: string, payload: Record<string, unknown>) {
  return new Promise<any>((resolve, reject) => {
    client[method](payload, (err: unknown, response: unknown) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

export const grpcProduct = {
  getProduct: (id: string) => call("GetProduct", { id }),
  createProduct: (input: { name: string; price: number; branchId: string; description?: string | null }) =>
    call("CreateProduct", input),
  updateProduct: (input: { id: string; name?: string; price?: number; branchId?: string; description?: string | null }) =>
    call("UpdateProduct", input),
  deleteProduct: (id: string) => call("DeleteProduct", { id }),
  overridePrice: (input: { id: string; price: number }) => call("OverridePrice", input),
};
```

## `services/graphql-api/src/graphql/typeDefs.ts`

```ts
import gql from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    role: String!
    branchId: ID
    createdAt: String
    updatedAt: String
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    branchId: ID!
    description: String
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateProductInput {
    name: String!
    price: Float!
    branchId: ID!
    description: String
  }

  input UpdateProductInput {
    name: String
    price: Float
    branchId: ID
    description: String
  }

  input OverridePriceInput {
    price: Float!
  }

  type Query {
    me: User
    product(id: ID!): Product
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    overridePrice(id: ID!, input: OverridePriceInput!): Product!
  }
`;
```

## `services/graphql-api/src/graphql/resolvers.ts`

```ts
import { GraphQLError } from "graphql";
import { prisma } from "../lib/prisma.js";
import { grpcProduct } from "../grpc/client.js";
import { hasPermission, assertBranchScope, type AuthUser } from "../lib/permissions.js";
import { loginWithEmailPassword } from "../lib/auth.js";
import { publishEvent } from "../lib/kafka.js";
import { enqueueJob } from "../lib/rabbitmq.js";

function requireUser(user: AuthUser | null) {
  if (!user) throw new GraphQLError("Unauthorized");
  return user;
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: { user: AuthUser | null }) => {
      return requireUser(ctx.user);
    },

    product: async (_: unknown, args: { id: string }, ctx: { user: AuthUser | null }) => {
      const user = requireUser(ctx.user);
      if (!hasPermission(user, "product:read")) throw new GraphQLError("Forbidden");

      const product = await grpcProduct.getProduct(args.id);

      await publishEvent("product_viewed", {
        userId: user.userId,
        productId: args.id,
        branchId: user.branchId ?? null,
        at: new Date().toISOString(),
      });

      return product;
    },
  },

  Mutation: {
    login: async (_: unknown, args: { input: { email: string; password: string } }) => {
      const { token, payload } = await loginWithEmailPassword(args.input.email, args.input.password);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) throw new GraphQLError("User not found after login");
      return { token, user };
    },

    createProduct: async (_: unknown, args: { input: { name: string; price: number; branchId: string; description?: string | null } }, ctx: { user: AuthUser | null }) => {
      const user = requireUser(ctx.user);
      if (!hasPermission(user, "product:create")) throw new GraphQLError("Forbidden");
      assertBranchScope(user, args.input.branchId);

      const product = await grpcProduct.createProduct(args.input);

      await enqueueJob("product.image.process", {
        productId: product.id,
        branchId: product.branchId,
        name: product.name,
      });

      return product;
    },

    updateProduct: async (_: unknown, args: { id: string; input: { name?: string; price?: number; branchId?: string; description?: string | null } }, ctx: { user: AuthUser | null }) => {
      const user = requireUser(ctx.user);
      if (!hasPermission(user, "product:update")) throw new GraphQLError("Forbidden");

      const branchId = args.input.branchId ?? user.branchId ?? null;
      assertBranchScope(user, branchId);

      return grpcProduct.updateProduct({
        id: args.id,
        ...args.input,
        branchId: branchId ?? undefined,
      });
    },

    deleteProduct: async (_: unknown, args: { id: string }, ctx: { user: AuthUser | null }) => {
      const user = requireUser(ctx.user);
      if (!hasPermission(user, "product:delete")) throw new GraphQLError("Forbidden");

      await grpcProduct.deleteProduct(args.id);
      await publishEvent("product_deleted", { userId: user.userId, productId: args.id });
      return true;
    },

    overridePrice: async (_: unknown, args: { id: string; input: { price: number } }, ctx: { user: AuthUser | null }) => {
      const user = requireUser(ctx.user);
      if (!hasPermission(user, "product:price:override")) throw new GraphQLError("Forbidden");
      return grpcProduct.overridePrice({ id: args.id, price: args.input.price });
    },
  },

  User: {
    createdAt: (u: { createdAt?: Date }) => u.createdAt?.toISOString?.() ?? null,
    updatedAt: (u: { updatedAt?: Date }) => u.updatedAt?.toISOString?.() ?? null,
  },

  Product: {
    createdAt: (p: { createdAt?: Date }) => p.createdAt?.toISOString?.() ?? null,
    updatedAt: (p: { updatedAt?: Date }) => p.updatedAt?.toISOString?.() ?? null,
  },
};
```

## `services/graphql-api/src/context.ts`

```ts
import type { Request } from "express";
import { verifyBearerToken } from "./lib/auth.js";
import type { AuthUser } from "./lib/permissions.js";

export async function createContext({ req }: { req: Request }) {
  const user = await verifyBearerToken(req.headers.authorization ?? null);
  return { user: user as AuthUser | null };
}
```

## `services/graphql-api/src/index.ts`

```ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./graphql/typeDefs.js";
import { resolvers } from "./graphql/resolvers.js";
import { connectRedis } from "./lib/redis.js";
import { createContext } from "./context.js";
import { prisma } from "./lib/prisma.js";

const PORT = Number(process.env.GRAPHQL_PORT ?? 4000);
const app = express();
const server = new ApolloServer({ typeDefs, resolvers });

async function bootstrap() {
  await connectRedis();
  await server.start();

  app.get("/health", (_, res) => res.json({ ok: true, service: "graphql-api" }));

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req }),
    })
  );

  app.listen(PORT, () => console.log(`GraphQL API running on port ${PORT}`));
}

bootstrap().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
```

---

# services/grpc-product

## `services/grpc-product/package.json`

```json
{
  "name": "quickzon-grpc-product",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "prisma generate --schema ../../prisma/schema.prisma && tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate --schema ../../prisma/schema.prisma",
    "prisma:migrate": "prisma migrate deploy --schema ../../prisma/schema.prisma"
  },
  "dependencies": {
    "@grpc/grpc-js": "^1.12.2",
    "@grpc/proto-loader": "^0.8.0",
    "@prisma/client": "^6.16.2",
    "dotenv": "^16.6.1",
    "kafkajs": "^2.2.4",
    "redis": "^5.8.2"
  },
  "devDependencies": {
    "@types/node": "^24.3.0",
    "prisma": "^6.16.2",
    "tsx": "^4.19.4",
    "typescript": "^5.9.2"
  }
}
```

## `services/grpc-product/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

## `services/grpc-product/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/services/grpc-product

COPY services/grpc-product/package*.json ./
COPY services/grpc-product/tsconfig.json ./
COPY prisma /app/prisma

RUN npm install

COPY services/grpc-product ./

RUN npx prisma generate --schema /app/prisma/schema.prisma
RUN npm run build

FROM node:20-alpine

WORKDIR /app/services/grpc-product

COPY --from=builder /app/services/grpc-product/node_modules ./node_modules
COPY --from=builder /app/services/grpc-product/dist ./dist
COPY --from=builder /app/prisma /app/prisma
COPY services/grpc-product/package*.json ./

EXPOSE 50051

CMD ["sh", "-c", "npx prisma migrate deploy --schema /app/prisma/schema.prisma && node dist/server.js"]
```

## `services/grpc-product/proto/product.proto`

```proto
syntax = "proto3";

package quickzon;

service ProductService {
  rpc GetProduct (ProductByIdRequest) returns (ProductResponse);
  rpc CreateProduct (CreateProductRequest) returns (ProductResponse);
  rpc UpdateProduct (UpdateProductRequest) returns (ProductResponse);
  rpc DeleteProduct (ProductByIdRequest) returns (DeleteProductResponse);
  rpc OverridePrice (OverridePriceRequest) returns (ProductResponse);
}

message ProductByIdRequest {
  string id = 1;
}

message CreateProductRequest {
  string name = 1;
  double price = 2;
  string branchId = 3;
  string description = 4;
}

message UpdateProductRequest {
  string id = 1;
  string name = 2;
  double price = 3;
  string branchId = 4;
  string description = 5;
}

message OverridePriceRequest {
  string id = 1;
  double price = 2;
}

message ProductResponse {
  string id = 1;
  string name = 2;
  double price = 3;
  string branchId = 4;
  string description = 5;
  string createdAt = 6;
  string updatedAt = 7;
}

message DeleteProductResponse {
  bool success = 1;
}
```

## `services/grpc-product/src/lib/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

## `services/grpc-product/src/lib/redis.ts`

```ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
export const redis = createClient({ url: redisUrl });

redis.on("error", (error) => console.error("[redis]", error));

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
}
```

## `services/grpc-product/src/lib/kafka.ts`

```ts
import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
const kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT_ID ?? "quickzon-backend", brokers });
const producer = kafka.producer();
let connected = false;

async function ensureConnected() {
  if (!connected) {
    await producer.connect();
    connected = true;
  }
}

export async function publishEvent(topic: string, value: unknown) {
  await ensureConnected();
  await producer.send({ topic, messages: [{ value: JSON.stringify(value) }] });
}
```

## `services/grpc-product/src/repositories/product.repository.ts`

```ts
import { prisma } from "../lib/prisma.js";

export type ProductInput = {
  name: string;
  price: number;
  branchId: string;
  description?: string | null;
};

export async function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({
    data: {
      name: input.name,
      price: input.price,
      branchId: input.branchId,
      description: input.description ?? null,
    },
  });
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  return prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.branchId !== undefined ? { branchId: input.branchId } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  return true;
}

export async function overridePrice(id: string, price: number) {
  return prisma.product.update({
    where: { id },
    data: { price },
  });
}
```

## `services/grpc-product/src/services/product.service.ts`

```ts
import { redis } from "../lib/redis.js";
import { publishEvent } from "../lib/kafka.js";
import {
  createProduct as createProductRepo,
  deleteProduct as deleteProductRepo,
  findProductById,
  overridePrice as overridePriceRepo,
  updateProduct as updateProductRepo,
  type ProductInput,
} from "../repositories/product.repository.js";

function key(id: string) {
  return `product:${id}`;
}

function toResponse(product: {
  id: string;
  name: string;
  price: number;
  branchId: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    branchId: product.branchId,
    description: product.description ?? "",
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function getProduct(id: string) {
  const cached = await redis.get(key(id));
  if (cached) return JSON.parse(cached);

  const product = await findProductById(id);
  if (!product) throw new Error("Product not found");

  const response = toResponse(product);
  await redis.set(key(id), JSON.stringify(response), { EX: 60 * 5 });
  return response;
}

export async function createProduct(input: ProductInput) {
  const product = await createProductRepo(input);
  const response = toResponse(product);
  await redis.set(key(product.id), JSON.stringify(response), { EX: 60 * 5 });
  await publishEvent("product_created", { productId: product.id, ...response });
  return response;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const product = await updateProductRepo(id, input);
  const response = toResponse(product);
  await redis.del(key(id));
  await publishEvent("product_updated", { productId: id, ...response });
  return response;
}

export async function deleteProduct(id: string) {
  await deleteProductRepo(id);
  await redis.del(key(id));
  await publishEvent("product_deleted", { productId: id });
  return true;
}

export async function overridePrice(id: string, price: number) {
  const product = await overridePriceRepo(id, price);
  const response = toResponse(product);
  await redis.del(key(id));
  await publishEvent("product_price_overridden", { productId: id, price });
  return response;
}
```

## `services/grpc-product/src/server.ts`

```ts
import "dotenv/config";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { connectRedis } from "./lib/redis.js";
import { createProduct, deleteProduct, getProduct, overridePrice, updateProduct } from "./services/product.service.js";

const PORT = Number(process.env.GRPC_PRODUCT_PORT ?? 50051);
const protoPath = new URL("../proto/product.proto", import.meta.url).pathname;

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const loaded = grpc.loadPackageDefinition(packageDefinition) as any;
const ProductService = loaded.quickzon.ProductService;

async function main() {
  await connectRedis();

  const server = new grpc.Server();

  server.addService(ProductService.service, {
    GetProduct: async (call: any, callback: any) => {
      try {
        const product = await getProduct(call.request.id);
        callback(null, product);
      } catch (error: any) {
        callback({ code: grpc.status.NOT_FOUND, message: error.message }, null);
      }
    },

    CreateProduct: async (call: any, callback: any) => {
      try {
        const product = await createProduct({
          name: call.request.name,
          price: call.request.price,
          branchId: call.request.branchId,
          description: call.request.description || null,
        });
        callback(null, product);
      } catch (error: any) {
        callback({ code: grpc.status.INTERNAL, message: error.message }, null);
      }
    },

    UpdateProduct: async (call: any, callback: any) => {
      try {
        const product = await updateProduct(call.request.id, {
          name: call.request.name || undefined,
          price: call.request.price || undefined,
          branchId: call.request.branchId || undefined,
          description: call.request.description || undefined,
        });
        callback(null, product);
      } catch (error: any) {
        callback({ code: grpc.status.INTERNAL, message: error.message }, null);
      }
    },

    DeleteProduct: async (call: any, callback: any) => {
      try {
        await deleteProduct(call.request.id);
        callback(null, { success: true });
      } catch (error: any) {
        callback({ code: grpc.status.INTERNAL, message: error.message }, null);
      }
    },

    OverridePrice: async (call: any, callback: any) => {
      try {
        const product = await overridePrice(call.request.id, call.request.price);
        callback(null, product);
      } catch (error: any) {
        callback({ code: grpc.status.INTERNAL, message: error.message }, null);
      }
    },
  });

  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    server.start();
    console.log(`gRPC product service running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---

# services/worker-service

## `services/worker-service/package.json`

```json
{
  "name": "quickzon-worker-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "amqplib": "^0.10.5",
    "dotenv": "^16.6.1"
  },
  "devDependencies": {
    "@types/node": "^24.3.0",
    "tsx": "^4.19.4",
    "typescript": "^5.9.2"
  }
}
```

## `services/worker-service/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

## `services/worker-service/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app/services/worker-service

COPY services/worker-service/package*.json ./
COPY services/worker-service/tsconfig.json ./

RUN npm install

COPY services/worker-service ./

RUN npm run build

FROM node:20-alpine

WORKDIR /app/services/worker-service

COPY --from=builder /app/services/worker-service/node_modules ./node_modules
COPY --from=builder /app/services/worker-service/dist ./dist
COPY services/worker-service/package*.json ./

CMD ["node", "dist/index.js"]
```

## `services/worker-service/src/index.ts`

```ts
import "dotenv/config";
import amqp from "amqplib";

const url = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";
const queue = "product.image.process";

async function main() {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, { durable: true });

  console.log(`RabbitMQ worker listening on ${queue}`);

  channel.consume(queue, async (message) => {
    if (!message) return;

    try {
      const payload = JSON.parse(message.content.toString());
      console.log("[worker] processing job:", payload);
      channel.ack(message);
    } catch (error) {
      console.error("[worker] failed:", error);
      channel.nack(message, false, false);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

---

## Run order

```bash
docker compose up --build -d
docker compose exec graphql-api npx prisma migrate deploy --schema /app/prisma/schema.prisma
```

## Quick demo queries

Login:
```graphql
mutation {
  login(input: { email: "manager@quickzon.com", password: "password" }) {
    token
    user { id email role branchId }
  }
}
```

Get product:
```graphql
query {
  product(id: "YOUR_PRODUCT_ID") {
    id
    name
    price
    branchId
  }
}
```

Create product:
```graphql
mutation {
  createProduct(input: {
    name: "Cola"
    price: 40
    branchId: "YOUR_BRANCH_ID"
    description: "Cold drink"
  }) {
    id
    name
    price
  }
}
```
