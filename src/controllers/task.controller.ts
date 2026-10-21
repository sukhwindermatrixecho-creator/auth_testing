import {Request, Response, NextFunction} from "express";
import { prisma } from "../lib/prisma.js";

export async function createTask(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { title } = req.body;

        const task = await prisma.task.create({
            data: {
                title,
                userId: req.user!.userId,
            },
        });

        return res.status(201).json({
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        return next(error);
    }
}