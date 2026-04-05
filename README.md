# QuickZon Microservices - A Quick Commerce System Design :)

---

# 🐳 1. DOCKER IMAGES

```bash
docker pull redis
docker pull postgres
docker pull rabbitmq:3-management
docker pull python:3.11-slim
docker pull node:20-alpine
docker pull golang:1.24-alpine
```

## Check Docker images
```
docker images
```

---

# 🐍 2. PYTHON SERVICE (FastAPI)

## 📁 Setup

```bash
mkdir ./services/python-service
cd services/python-service

python -m venv myvenv
.\myvenv\Scripts\activate
```

---

## 📁 Structure

```
python-service/
├── app/
│   └── main.py
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

---

## 📄 app/main.py

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def health():
    return {"status": "ok"}
```

---

## 📄 requirements.txt

```txt
fastapi
uvicorn
numpy
pandas
scikit-learn
```

---

## 🐳 Dockerfile

```dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y build-essential

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --prefix=/install -r requirements.txt

FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🚫 .dockerignore

```
myvenv/
venv/
env/
__pycache__/
**/__pycache__/
*.pyc
*.pyo
*.pyd
.git
.env
*.log
```

## Installation 

```
pip install -r ./requirements.txt
```

---

# ⚡ 3. NODE (TS) SERVICE

## 📁 Setup

```bash
mkdir services/ts-service
cd services/ts-service

npm init -y

npm install -D typescript ts-node

npx tsc --init
```

---

## 📁 Structure

```
product-service-ts/
├── src/
│   └── index.ts
├── dist/
├── Dockerfile
├── tsconfig.json
├── package.json
└── .dockerignore
```

---

## 📄 src/index.ts

```ts
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "Service is healthy" });
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
```

---

## 📄 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "sourceMap": true,
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## 🐳 Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app .

CMD ["node", "dist/index.js"]
```

---

## 🚫 .dockerignore

```
node_modules
.git
.env
```

## Installation

```
npm install express redis amqplib dotenv cors bcryptjs cloudinary cookie-parser jsonwebtoken mongoose multer nodemailer razorpay socket.io zod uuid prisma ioredis

npm install -D nodemon @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken @types/bcryptjs @types/multer
```

---

# 🐹 4. GO SERVICE

## 📁 Setup

```bash
mkdir services/go-service
cd services/go-service

go mod init product-service
```

---

## 📁 Structure

```
go-service/
├── cmd/
│   └── main.go
├── internal/
├── Dockerfile
└── .dockerignore
```

---

## 📄 cmd/main.go

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Go service running",
		})
	})

	r.Run(":8080")
}
```

---

## 🐳 Dockerfile

```dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY . .

RUN go mod tidy
RUN go build -o main ./cmd/main.go

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/main .

CMD ["./main"]
```

---

## 🚫 .dockerignore

```
.git
.env
*.log
```

## Installation

```
go get github.com/gin-gonic/gin github.com/redis/go-redis/v9 github.com/joho/godotenv github.com/jackc/pgx/v5 github.com/gin-contrib/cors github.com/rabbitmq/amqp091-go github.com/google/uuid
```

---

# 🐳 5. ROOT docker-compose.yml

```yaml
version: '3.8'

services:
  redis:
    image: redis
    ports:
      - "6379:6379"

  postgres:
    image: postgres
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: quickcommerce
    ports:
      - "5432:5432"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  ts-service:
    build: ./services/ts-service
    ports:
      - "8080:80"
    environment:
      - PORT=80
    depends_on:
      - redis

  go-service:
    build: ./services/go-service
    ports:
      - "${GO_PORT}:80"
    environment:
      - PORT=80
    depends_on:
      - redis
```

---

# 🚀 RUN EVERYTHING

```bash
docker compose up --build -d
```

---

# 🧠 FINAL

You now have:
- Node (API)
- Go (core)
- Python (ML)
- Redis, Postgres, RabbitMQ

A FULL distributed backend system setup by Karanjot Singh :)

## 🔗 Connect

Follow my journey -> [@Karanbuidls](https://x.com/karanbuidls)