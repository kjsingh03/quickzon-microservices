import mongoose from "mongoose";

export default async function db() {
    console.log(process.env.MONGO_URL);
    
    await mongoose.connect(process.env.MONGO_URL!)
        .then(() => console.log("MongoDB connected"))
        .catch(e => console.log("Failed to connect to database", e));
}

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default async function db() {
//   await prisma.$connect();
//   console.log('DB connected');
// }

// export { prisma as db };