import express from "express"
import {validate} from "../middleware/validate.js"
import { RestaurantSchema } from "../schemas/restaurant.js";
const router = express.Router();

router.get("/", validate(RestaurantSchema), async (req, res)=> {
    const data = req.body 
    res.send("Hello World");
})

export default router;