import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app.error.js";
import { asyncHandler } from "../utils/async-handler.js";

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

export async function updateTask(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const taskId = Number(req.params.id);
        const { title } = req.body;

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                message: "Invalid task ID",
            });
        }
        const result = await prisma.task.updateMany({
            where: {
                id: taskId,
                userId: req.user!.userId,
            },
            data: {
                title,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        return res.json({
            message: "Task updated successfully"
        });
    } catch (error) {
        return next(error);
    }
}

export async function deleteTask(
    req: Request,
    res: Response,
    next: NextFunction,
) {

    try {
        const taskId = Number(req.params.id);

        if (!Number.isInteger(taskId) || taskId <= 0) {
            return res.status(400).json({
                message: "Invalid taskId",
            });
        }
        const result = await prisma.task.deleteMany({
            where: {
                id: taskId,
                userId: req.user!.userId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        return res.json({
            message: "Task deleted successfully",
        });
    } catch (error) {
        return next(error);
    }
}

export const getTaskById = asyncHandler(async (req, res) => {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new AppError("Invalid task ID", 400);
    }

    const task = await prisma.task.findFirst({
        where: {
            id: taskId,
            userId: req.user!.userId,
        },
    });

    if (!task) {
        throw new AppError("Task not found", 404);
    }

    return res.json({
        message: "Task fetched successfully",
        task,
    });
});

export const getMyTasks = asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if(
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw new AppError("Page must be a positive integer and limit must be between 1 and 100", 400);
    }
    
    const skip = (page - 1) * limit;

    const tasks = await prisma.task.findMany({
        where: {
            userId: req.user!.userId,
        },
        orderBy: {
            createdAt: "desc",
        },
        skip,
        take: limit,
    });

    return res.json({
        message: "Tasks fetched successfully",
        tasks,
    });
});