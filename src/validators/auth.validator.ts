import {z} from "zod";

export const registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must of minimum 8 characters'),
});


export const loginSchema = z.object({
    email: z.email('Invalid email addresss'),
    password: z.string().min(1, 'password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.email('Invalid email address'),
});