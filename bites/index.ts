import express from "express"
import restRouter from "./routes/resturants.js"
import cusRouter from "./routes/cusines.js"
import { erroHandler } from "./middleware/errorhandler.js"

const port = process.env.PORT || 3000
const app = express()
app.use(express.json())

app.use("/restaurants", restRouter);
app.use("/cuisines", cusRouter);

app.use(erroHandler)

app.listen(port, ()=> {
    console.log(`app running on port: ${port}`)
}).on("error",(error)=> {
    throw new Error(error.message)
})