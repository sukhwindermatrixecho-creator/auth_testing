import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
    userId: number;
};

export function authenticatedToken(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        return res.status(401).json({
            message: "Authorization header is required",
        });
    }
    const [scheme, token] = authHeader.split(" ");
    if(scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Invalid format of authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY!) as JwtPayload;
        req.user = {
            userId: payload.userId,
        };

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}