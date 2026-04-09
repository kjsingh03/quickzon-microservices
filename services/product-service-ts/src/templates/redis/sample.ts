import Express, { Request, Response, NextFunction, } from "express";
import cors from "cors";
import { RedisClient } from "./config.js";

const PORT = process.env.PORT

const app = Express();
const redisClient = RedisClient();

app.use(cors())
    .use(Express.json())
    .get("/", (req, res) => {
        res.json({ success: true, message: "Service is healthy" })
    })
    .get("/test", async (require, res) => {
        const cachedValue = await redisClient.get("todos");
        if (cachedValue) {
            res.status(200).json({ success: true, data: JSON.parse(cachedValue), message: "Fetched by redis" })
            console.log("[Redis] Sucessfully retrieved data")
            return
        };

        const data = await new Promise((resolve, reject) => {
            setTimeout(() => { resolve("Hey there") }, 5000);
        })

        await redisClient.set("todos", JSON.stringify(data));
        await redisClient.expire("todos", 30);
        
        return res.status(200).json({ success: true, data });
    })
    .use((err: Error, req: Request, res: Response, next: NextFunction) => {
        return res.status(404).json({ success: false, message: err.message, })
    })
    .get("/set", (req, res) => {
        const query = req.query
        console.log(query)
        Object.entries(query).forEach(async ([name, value]) => {
            await redisClient.set(name, JSON.stringify(value))
            await redisClient.expire(name, 15)
            console.log(name, JSON.stringify(value))
        })
        return res.status(200).json({ success: true, data: query });
    })
    .get("/get/:field", async (req, res) => {
        const value = JSON.parse(await redisClient.get(req.params.field) ?? "")
        console.log(value)
        return res.status(200).json({ success: true, data: value != "" ? value : "Not found" });
    })

app.listen(PORT, () => {
    console.log(
        `Server is running at http://localhost:${PORT}`
    )
})