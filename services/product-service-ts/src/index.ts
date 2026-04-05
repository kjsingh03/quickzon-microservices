import Express from "express";
import cors from "cors";
import Redis from "ioredis"

const PORT = process.env.PORT
const app = Express();

const redisClient = new Redis();

app.use(cors())
    .use(Express.json())

app.get("/", (req, res) => {
    res.json({ success: true, message: "Service is healthy" })
})

    .get("/test", async (require, res) => {
        try {
            const cachedValue = await redisClient.get("todos");
            if (cachedValue) {
                res.status(200).json({ success: true, data: JSON.parse(cachedValue), message: "Fetched by redis" })
                console.log("Redis data")
                return
            };

            const data = await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve("Hey there")
                }, 5000);
            })

            await redisClient.set("todos", JSON.stringify(data));
            await redisClient.expire("todos", 30);

            return res.status(200).json({ success: true, data });
        } catch (e) {
            return res.status(404).json({ success: false, message: e, })
        }
    })

app.listen(PORT, () => {
    console.log(
        `Server is running at http://localhost:${PORT}`
    )
})