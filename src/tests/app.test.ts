import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/enums.js";

describe("Application", () => {
    it("should return 200 for the health endpoint", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
    });


    it("should reject requests without an access token", async () => {
        const response = await request(app).get("/tasks");

        expect(response.status).toBe(401);
    });

    it("it should reject a malformed access token", async () => {
        const response = await request(app)
            .get("/tasks")
            .set("authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid or expired token");
    });

    it("should reject an admin request without an access token", async () => {
        const response = await request(app).get("/users/admin-only");

        expect(response.status).toBe(401);
    });

    it("should forbid a regular user from accessing admin-only routes", async () => {
        const user = await prisma.user.create({
            data: {
                name: "Test User",
                email: `test-${Date.now()}@example.com`,
                password: "test-password-hash",
                role: Role.USER,
                emailVerified: true,
            },
        });

        try {
            const token = jwt.sign(
                { userId: user.id },
                process.env.SECRET_KEY!,
            );

            const response = await request(app)
                .get("/users/admin-only")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Forbidden");
        } finally {
            await prisma.user.delete({
                where: { id: user.id },
            });
        }
    });
});