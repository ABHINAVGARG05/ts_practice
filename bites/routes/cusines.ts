import express from "express";
import { intialiseRedisClient } from "../utils/clients.js";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/key.js";
import { successResponse } from "../utils/responses.js";
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const client = await intialiseRedisClient();
    const cuisines = await client.sMembers(cuisinesKey);
    return successResponse(res, cuisines);
  } catch (error) {
    next(error);
  }
});

router.get("/:cuisine", async (req, res, next) => {
  const { cuisine } = req.params;
  try {
    const client = await intialiseRedisClient();
    const restaurantIds = await client.sMembers(cuisineKey(cuisine));
    const restaurants = await Promise.all(
      restaurantIds.map((id) => client.hGet(restaurantKeyById(id), "name"))
    );
    return successResponse(res, restaurants);
  } catch (error) {
    next(error);
  }
});

export default router;
