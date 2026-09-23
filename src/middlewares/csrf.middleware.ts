import { Request, Response, NextFunction } from "express";

export function csrfProtection(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const csrfToken = req.cookies?.csrfToken;
    const csrfHeader = req.headers['x-csrf-token'];

    if(!csrfToken || csrfToken !== csrfHeader) {
        return res.status(403).json({
            message: "Invalid CSRF token",
        });
    }

    next();
}