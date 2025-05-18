import express from "express";
import type { Request } from "express";
import { validate } from "../middleware/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { intialiseRedisClient } from "../utils/clients.js";
import {
  bloomKey,
  cuisineKey,
  cuisinesKey,
  restaurantCuisinesKeyById,
  restaurantKeyById,
  restaurantsByRatingKey,
} from "../utils/key.js";
import { nanoid } from "nanoid/non-secure";
import { errorResponse, successResponse } from "../utils/responses.js";
import { checkRestaurantExists } from "../middleware/checkRestaurantId.js";
const router = express.Router();

router.get("/", validate(RestaurantSchema), async (req, res) => {
  const data = req.body;
  const client = await intialiseRedisClient();
  res.send("Hello World");
});

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
  const data = req.body as Restaurant;
  try {
    const client = await intialiseRedisClient();
    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);
    const bloomString = `${data.name}:${data.location}`;
    const seenBefore = await client.bf.exists(bloomKey, bloomString);
    if (seenBefore) {
      return errorResponse(res, 409, "Restaurant already exists");
    }
    const hashData = { id, name: data.name, location: data.location };
    await Promise.all([
      ...data.cuisines.map((cuisine) =>
        Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantCuisinesKeyById(id), cuisine),
        ])
      ),
      client.hSet(restaurantKey, hashData),
      client.zAdd(restaurantsByRatingKey, {
        score: 0,
        value: id,
      }),
      client.bf.add(bloomKey, bloomString),
    ]);
    return successResponse(res, hashData, "Added new restaurant");
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:restaurantId",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    try {
      const client = await intialiseRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const [viewCount, restaurant] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
      ]);
      return successResponse(res, restaurant);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
