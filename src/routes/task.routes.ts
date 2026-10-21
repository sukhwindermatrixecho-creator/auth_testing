import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { createTask, deleteTask, updateTask } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/create", authenticatedToken, createTask);
router.patch("/update/:id", authenticatedToken, updateTask);
router.delete("/delete/:id", authenticatedToken, deleteTask);

export default router;