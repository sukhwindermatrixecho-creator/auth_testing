import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";

export function requiredRole(role: Role) {
    return async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        if(!req.user) {
            return res.status(401).json({
                message: "Authentication is required",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                role: true,
            },
        });

        if(!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if(user.role !== role) {
            return res.status(403).json({
                message: "Forbidden",
            });
        }

        next();
    }
}