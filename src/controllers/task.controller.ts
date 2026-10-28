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
    const completedQuery = req.query.completed;
    const sortBy = req.query.sortBy ?? "createdAt";
    const order = req.query.order ?? "desc";
    const search = req.query.search;

    if(
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw new AppError("Page must be a positive integer and limit must be between 1 and 100", 400);
    }

    if(
        completedQuery !== undefined &&
        completedQuery !== "true" &&
        completedQuery !== "false"
    ) {
        throw new AppError("completed must be either true or false", 400);
    }

    if(
        sortBy !== "createdAt" &&
        sortBy !== "title"
    ) {
        throw new AppError("sortBy must be createdAt or title", 400);
    }

    if(order !== "asc" && order !== "desc") {
        throw new AppError("order must be asc or desc", 400);
    }

    const orderBy = {
        [sortBy]: order,
    }

    if(
        search !== undefined &&
        (typeof search !== "string" || search.trim().length === 0) 
    ) {
        throw new AppError("search must be a non-empty string", 400);
    }
    
    const where = {
        userId: req.user!.userId,
        ...(completedQuery !== undefined && {
            completed: completedQuery === "true",
        }),
        ...(search !== undefined && {
            title: {
                contains: search.trim(),
                mode: "insensitive" as const,
            },
        }),
    };

    const skip = (page - 1) * limit;

    const [tasks, totalTasks] = await prisma.$transaction([
        prisma.task.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        }),

        prisma.task.count({
            where,
        }),
    ]);

    const totalPages = Math.ceil(totalTasks / limit);

    return res.json({
        message: "Tasks fetched successfully",
        pagination: {
            totalTasks,
            totalPages,
            currentPage: page,
            limit,
        },
        tasks,
    });
});

export const bulkCreateTasks = asyncHandler(async (req, res) => {
    const {tasks} = req.body;

    const result = await prisma.task.createMany({
        data: tasks.map((task: {title: string}) => ({
            title: task.title,
            userId: req.user!.userId,
        })),
    });

    return res.status(201).json({
        message: "Tasks created successfully",
        count: result.count,
    });
});