import express from "express"
import {validate} from "../middleware/validate.js"
import { RestaurantSchema } from "../schemas/restaurant.js";
import { intialiseRedisClient } from "../utils/clients.js";
const router = express.Router();

router.get("/", validate(RestaurantSchema), async (req, res)=> {
    const data = req.body;
    const client = await intialiseRedisClient()
    res.send("Hello World");
})

export default router;