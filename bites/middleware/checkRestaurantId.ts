import type { Request, Response, NextFunction } from "express";
import { intialiseRedisClient } from "../utils/clients.js";
import { restaurantKeyById } from "../utils/key.js";
import { errorResponse } from "../utils/responses.js";

export const checkRestaurantExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId } = req.params;
  if (!restaurantId) {
    return errorResponse(res, 400, "Restaurant ID not found");
  }
  const client = await intialiseRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId);
  const exists = await client.exists(restaurantKey);
  if (!exists) {
    return errorResponse(res, 404, "Restaurant not found");
  }
  next();
};
