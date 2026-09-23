import express from "express";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../validators/auth.validator.js";
import { deleteAccount, loginUser, refreshAccessToken, registerUser } from "./auth.service.js";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { emailVerificationRateLimiter, loginRateLimiter, passwordResetRateLimiter } from "../middlewares/rate-limit.middleware.js";
import crypto from "node:crypto";
import { csrfProtection } from "../middlewares/csrf.middleware.js";
import { createResetPasswordToken, resetPassword } from "./password-reset.service.js";
import { resendEmailVerification, verifyEmail } from "./email-verification.service.js";
import { sendEmail } from "../lib/email.js";

const router = express.Router();

router.post('/register', async (req, res) => {
    const result = registerSchema.safeParse(req.body);
    if(!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues,
        });
    }

    const { name, email, password } = result.data;

    const user = await registerUser(name, email, password);

    return res.status(201).json({
        message: "Registered successfully",
        user,
    });
});

router.post('/login', loginRateLimiter, async (req, res) => {
    const schemaResult = loginSchema.safeParse(req.body);
    
    if(!schemaResult.success) {
        return res.status(401).json({
            message: "Validation failed",
            errors: schemaResult.error.issues,
        });
    }

    const { email, password } = schemaResult.data;

    const result = await loginUser(email, password);

    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken = crypto.randomBytes(64).toString("hex");
    res.cookie('csrfToken', csrfToken, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
        message: "Login successfully",
        accessToken: result.accessToken,
    });
});

router.post('/me', authenticatedToken, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });

    if(!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }

    return res.json({
        user,
    });
});

router.post(
    '/refresh',
    // csrfProtection,
    async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
        return res.status(401).json({
            message: "Refresh token is required",
        });
    }

    const result = await refreshAccessToken(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 7 * 60 * 60 * 1000,
    });

    return res.json(result.accessToken);
});

router.post(
    '/logout',
    // csrfProtection,
    async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if(refreshToken) {
        await prisma.refreshToken.update({
            where: { token: refreshToken },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    res.clearCookie('csrfToken', {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
    });

    return res.json({
        message: "Logout successfully",
    });
});

router.post('/forgot-password', passwordResetRateLimiter, async (req, res) => {
    const result = forgotPasswordSchema.safeParse(req.body);
    if(!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues,
        });
    }
    const { email } = result.data;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if(!user) {
        return res.json({
            message: "If an account exists with this email, a password reset link has been sent.",
        });
    }

    const resetToken = await createResetPasswordToken(user.id);

    const resetUrl = `http://localhost:8000/auth/reset-password?token=${resetToken}`;

    await sendEmail(
        user.email,
        "Reset your password",
        `Please click the following link to reset your password: 
        
        ${resetUrl}
        
        This link will expire in 15 minutes. If you did not request this, please ignore this email.`,
    );

    return res.json({
        message: "If an account exists with this email, a password reset link has been sent.",
    });
});

router.post('/reset-password', async (req, res) => {
    const {token, newPassword} = req.body;

    if(
        typeof token !== "string" ||
        typeof newPassword !== "string"
    ) {
        return res.status(400).json({
            message: "Token and new password are required",
        });
    }

    if(newPassword.length < 8) {
        return res.status(400).json({
            message: "Password must be of 8 characters",
        });
    }

    await resetPassword(token, newPassword);

    return res.json({
        message: "Password reset successfully",
    });
});

router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    if(typeof token !== "string") {
        return res.status(400).json({
            message: "Token is required",
        });
    }

    await verifyEmail(token);

    return res.json({
        message: "Email verified successfully",
    });
});

router.post('/resend-verification', emailVerificationRateLimiter, async (req, res) => {
    const {email} = req.body;

    if(typeof email !== "string") {
        return res.status(400).json({
            message: "Valid email is required",
        });
    }

    await resendEmailVerification(email);

    return res.json({
        message: "If account exits with this email and is not verified, a verification link has been sent",
    });
});

router.delete('/account', authenticatedToken, async (req, res) => {
    await deleteAccount(req.user!.userId);

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    })

    res.clearCookie('csrfToken', {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    return res.json({
        message: 'Account deleted successfully',
    });
});

export default router;