import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../errors/app.error.js";
import { sendEmail } from "../lib/email.js";

export async function createEmailVerificationToken(userId: number) {
    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(
        Date.now() + 15 * 60 * 1000,
    );

    await prisma.emailVerificationToken.create({
        data: {
            tokenHash,
            userId,
            expiresAt,
        },
    });

    return token;
}

export async function verifyEmail(token: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const storedToken = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
    });

    if(!storedToken) {
        throw new AppError('Invalid or expired verification token', 401);
    }

    if(storedToken.expiresAt <= new Date()) {
        throw new AppError('Invalid or expired verification token', 401);
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: storedToken.userId },
            data: { emailVerified: true },
        }),

        prisma.emailVerificationToken.delete({
            where: { id: storedToken.id },
        }),
    ]);
}

export async function resendEmailVerification(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if(!user) {
        return;
    }

    if(user.emailVerified) {
        return;
    }

    await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
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
}