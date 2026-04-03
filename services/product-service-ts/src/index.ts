import Express from "express";
import cors from "cors";

const PORT = process.env.PORT
const app = Express();

app.use(cors())
    .use(Express.json())

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Service is healthy"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
})