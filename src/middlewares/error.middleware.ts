import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error.js";

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (res.headersSent) {
        return next(error);
    }
    
    if(error instanceof AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "Internal server error",
    });
}