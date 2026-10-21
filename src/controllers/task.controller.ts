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

export async function updateTask(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const taskId = Number(req.params.id);
    const {title} = req.body;

    if(!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({
            message: "Invalid task ID",
        });
    }
    try {
        const result = await prisma.task.updateMany({
            where: {
                id: taskId,
                userId: req.user!.userId,
            },
            data: {
                title,
            },
        });
    
        if(result.count === 0) {
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