import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { createTask } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/create", authenticatedToken, createTask);

export default router;