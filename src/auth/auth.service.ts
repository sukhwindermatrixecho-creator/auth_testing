import { AppError } from "../errors/app.error.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { createEmailVerificationToken } from "./email-verification.service.js";
import { sendEmail } from "../lib/email.js";

export async function registerUser(
    name: string,
    email: string,
    password: string,
) {
    const exitingUser = await prisma.user.findUnique({
        where: { email },
    });
    if(exitingUser) {
        throw new AppError('Email already exits', 401);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    const verificationToken = await createEmailVerificationToken(user.id);

    const verificationUrl = `http://localhost:8000/auth/verify-email?token=${verificationToken}`;

    await sendEmail(
        user.email,
        "Verify your email",
        `Please click the following link to verify your email: 
        
        ${verificationUrl}
        
        This link will expire in 15 minutes. If you did not request this, please ignore this email.`,
    );

    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}

export async function loginUser(
    email: string,
    password: string,
) {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if(!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if(!passwordMatched) {
        throw new AppError('Invalid email or password', 401);
    }

    if(!user.emailVerified) {
        throw new AppError("Please verify your email before login", 401);
    }

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
    );

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: refreshTokenExpiresAt,
        },
    });

    const accessToken = jwt.sign(
        {
            userId: user.id,
        },
        process.env.SECRET_KEY!,
        {
            expiresIn: "15m",
        },
    );   

    return {
        accessToken,
        refreshToken,
    }
}

export async function refreshAccessToken(
    refreshToken: string
) {
    const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
    });

    if(!storedToken) {
        throw new AppError('Invalid refresh token', 401);
    }

    if(storedToken.revokedAt) {
        await prisma.refreshToken.updateMany({
            where: {
                userId: storedToken.userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });

        throw new AppError('Refresh token reuse detected', 401);
    }

    if(storedToken.expiresAt <= new Date()) {
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                revokedAt: null,
            },
        });
        throw new AppError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({
        where: { id: storedToken.userId },
    });

    if(!user) {
        throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = jwt.sign(
        {
            userId: user.id,
        },
        process.env.SECRET_KEY!,
        {
            expiresIn: "15m",
        },
    );

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newRefreshTokenExpiresAt = new Date(
        Date.now() + 24 * 7 * 60 * 60 * 1000,
    );

    await prisma.$transaction([
        prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                revokedAt: new Date(),
            },
        }),
        prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: user.id,
                expiresAt: newRefreshTokenExpiresAt,
            },
        }),
    ]);

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
}

export async function deleteAccount(userId: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if(!user) {
        throw new AppError('User not found', 404);
    }

    await prisma.user.delete({
        where: { id: userId },
    });
}