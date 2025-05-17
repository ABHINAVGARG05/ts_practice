import type {Request, Response, NextFunction} from "express";
import { errorResponse } from "../utils/responses.js";

export function erroHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    errorResponse(err, 500 , err);
}