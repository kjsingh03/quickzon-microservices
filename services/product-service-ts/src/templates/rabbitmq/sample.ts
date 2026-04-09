import Express, { Request, Response, NextFunction, } from "express";
import cors from "cors";
import { sendMail, receiveMail, receiveMail2, } from "./index.js";

const PORT = process.env.PORT
const app = Express();

app.use(cors())
    .use(Express.json())
    .get("/", (req, res) => {
        res.json({ success: true, message: "Service is healthy" })
    })
    .get("/send", async (req, res) => {
        const data = sendMail();
        const data1 = receiveMail();
        const data2 = receiveMail2();

        console.log(data1, data2)

        return res.status(200).json({ success: true, data });
    })
    .get("/receive", async (require, res) => {
        const data = receiveMail();

        return res.status(200).json({ success: true, data });
    })
    .use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.log(err)
        return res.status(404).json({ success: false, message: err.message, })
    })

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
})