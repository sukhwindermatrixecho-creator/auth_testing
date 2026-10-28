import { z } from "zod";

export const createTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title must not exceed 200 characters"),
}).strict();

export const bulkCreateTaskSchema = z.object({
    tasks: z
        .array(createTaskSchema)
        .min(1, "At least one task is required")
        .max(100, "You can create at most 100 tasks at once")
}).strict();


export const transferTaskSchema = z.object({
    toUserId: z.number().int().positive(),
}).strict();