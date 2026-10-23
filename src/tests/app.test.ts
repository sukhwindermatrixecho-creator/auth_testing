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

    it("should not allow a user to access other user's task", async () => {
        const userA = await prisma.user.create({
            data: {
                name: "User A",
                email: `a-${Date.now()}@example.com`,
                password: "test-password-hash",
                role: Role.USER,
                emailVerified: true,
            },
        });

        const userB = await prisma.user.create({
            data: {
                name: "User B",
                email: `b-${Date.now()}@example.com`,
                password: "test-password-hash",
                role: Role.USER,
                emailVerified: true,
            },
        });


        try {
            const task = await prisma.task.create({
                data: {
                    title: "Task A",
                    userId: userA.id,
                },
            });

            const userBToken = jwt.sign(
                { userId: userB.id },
                process.env.SECRET_KEY!,
            );

            const response = await request(app)
                .get(`/tasks/${task.id}`)
                .set("Authorization", `Bearer ${userBToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Task not found");
        } finally {
            await prisma.user.deleteMany({
                where: {
                    id: { in: [ userA.id, userB.id ] },
                },
            });
        }
    });

    it("should not allow user to update other user's task", async () => {
        const userA = await prisma.user.create({
            data: {
                name: "User A",
                email: `a-${Date.now()}@example.com`,
                password: "hashed-password",
                role: Role.USER,
                emailVerified: true,
            },
        });

        const userB = await prisma.user.create({
            data: {
                name: "User B",
                email: `b-${Date.now()}@example.com`,
                password: "hashed-password",
                role: Role.USER,
                emailVerified: true,
            },
        });

        try {
            const task = await prisma.task.create({
                data: {
                    title: "Task A",
                    userId: userA.id,
                },
            });

            const userBToken = jwt.sign(
                { userId: userB.id },
                process.env.SECRET_KEY!,
            );

            const response = await request(app)
                .patch(`/tasks/update/${task.id}`)
                .set("Authorization", `Bearer ${userBToken}`)
                .send({ title: "Task A change" });

            expect(response.status).toBe(404);
            
            const unchangedTask = await prisma.task.findUnique({
                where: {
                    id: task.id,
                },
            });

            expect(unchangedTask?.title).toBe("Task A");
        } finally {
            await prisma.user.deleteMany({
                where: {
                    id: { in: [userA.id, userB.id ]},
                },
            });
        }
    });

    it("should not allow user to delete other user's task", async () => {
        const userA = await prisma.user.create({
            data: {
                name: "User A",
                email: `a-${Date.now()}@example.com`,
                password: "hashed-password",
                role: Role.USER,
                emailVerified: true,
            },
        });

        const userB = await prisma.user.create({
            data: {
                name: "User B",
                email: `b-${Date.now()}@example.com`,
                password: "hashed-password",
                role: Role.USER,
                emailVerified: true,
            },
        });

        try {
            const task = await prisma.task.create({
                data: {
                    title: "Task A",
                    userId: userA.id,
                },
            });

            const tokenUserB = jwt.sign(
                { userId: userB.id },
                process.env.SECRET_KEY!,
            );

            const response = await request(app)
                .delete(`/tasks/delete/${task.id}`)
                .set("Authorization", `Bearer ${tokenUserB}`);

            expect(response.status).toBe(404);

            const remainingTask = await prisma.task.findUnique({
                where: {
                    id: task.id,
                },
            });

            expect(remainingTask).not.toBe(null);
        } finally {
            await prisma.user.deleteMany({
                where: {
                    id: { in: [userA.id, userB.id ]},
                },
            });
        }
    });

    it("should reject a task with an empty title", async () => {
        const user = await prisma.user.create({
            data: {
                name: "User A",
                email: `a-${Date.now()}@example.com`,
                password: "hashed-password",
                role: Role.USER,
                emailVerified: true,
            },
        });

        try {
            const token = jwt.sign(
                {userId: user.id},
                process.env.SECRET_KEY!,
            );

            const response = await request(app)
                .post("/tasks/create")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: ""});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Validation failed"),
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        field: "title",
                    }),
                ])
            );
        } finally {
            await prisma.user.delete({
                where: { id: user.id },
            });
        }
    });
});