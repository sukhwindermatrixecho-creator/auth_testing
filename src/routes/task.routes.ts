import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { createTask, updateTask } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/create", authenticatedToken, createTask);
router.patch("/update/:id", authenticatedToken, updateTask);

export default router;