import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { createTask, deleteTask, getMyTasks, getTaskById, updateTask } from "../controllers/task.controller.js";

const router = express.Router();

router.get("/", authenticatedToken, getMyTasks);
router.get("/:id", authenticatedToken, getTaskById);
router.post("/create", authenticatedToken, createTask);
router.patch("/update/:id", authenticatedToken, updateTask);
router.delete("/delete/:id", authenticatedToken, deleteTask);

export default router;