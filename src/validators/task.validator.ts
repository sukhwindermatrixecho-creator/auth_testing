import { z } from "zod";

export const createTaskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title must not exceed 200 characters"),
}).strict();