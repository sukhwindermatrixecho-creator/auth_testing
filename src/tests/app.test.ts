import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Application", () => {
    it("should return 200 for the health endpoint", async () => {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
    });


    it("should reject requests without an access token", async () => {
        const response = await request(app).get("/tasks");

        expect(response.status).toBe(401);
    });
});