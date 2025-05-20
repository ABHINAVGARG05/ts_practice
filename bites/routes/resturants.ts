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
  reviewDetailsKeyById,
  reviewKeyById,
} from "../utils/key.js";
import { nanoid } from "nanoid/non-secure";
import { errorResponse, successResponse } from "../utils/responses.js";
import { checkRestaurantExists } from "../middleware/checkRestaurantId.js";
import { ReviewSchema, type Review } from "../schemas/review.js";
import { timeStamp } from "console";
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
  "/:restaurantId/reviews",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start * Number(limit) - 1;

    try {
      const client = await intialiseRedisClient();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewIds = await client.lRange(reviewKey, start, end);
      const reviews = await Promise.all(
        reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id)))
      );
      return successResponse(res, reviews);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;
    try {
      const client = intialiseRedisClient();
      const reviewId = nanoid();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);
      const reviewData = {
        id: reviewId,
        ...data,
        timeStamp: Date.now(),
        restaurantId,
      };
      await Promise.all([
        (await client).lPush(reviewKey, reviewId),
        (await client).hSet(reviewDetailsKey, reviewData),
      ]);
      return successResponse(res, reviewData, "Review Added");
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExists,
  async (
    req: Request<{ restaurantId: string; reviewId: string }>,
    res,
    next
  ) => {
    const { restaurantId, reviewId } = req.params;
    try {
      const client = await intialiseRedisClient();
      const reviewKey = reviewKeyById(reviewId);
      const reviewKeyDetailsKey = reviewDetailsKeyById(reviewId);
      const [removeResult, deleteResult] = await Promise.all ([
        client.lRem(reviewKey, 0, reviewId),
        client.del(reviewKeyDetailsKey)
      ]);
      if (removeResult === 0 && deleteResult === 0) {
        return errorResponse(res, 404, "Review Not Found");
      }
      return successResponse(res, reviewId, "Review Deleted");
    }catch(error) {
      next(error)
    }
  }
);

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

