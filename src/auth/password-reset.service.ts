import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { AppError } from "../errors/app.error.js";

export async function createResetPasswordToken(userId: number) {
    const resetToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
        data: {
            tokenHash,
            userId,
            expiresAt,
        },
    });

    return resetToken;
}

export async function resetPassword(
    resetToken: string,
    newPassword: string,
) {
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if(!resetTokenRecord) {
        throw new AppError("Invalid or expired password reset token", 401);
    }

    if(resetTokenRecord.expiresAt <= new Date()) {
        await prisma.passwordResetToken.delete({
            where: { id: resetTokenRecord.id },
        });
        throw new AppError("Invalid or expired password reset token", 401);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: resetTokenRecord.userId },
            data: {
                password: passwordHash,
            },
        }),

        prisma.passwordResetToken.delete({
            where: { id: resetTokenRecord.id },
        }),

        prisma.refreshToken.deleteMany({
            where: {
                userId: resetTokenRecord.userId,
            },
        }),
    ]);
}