import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { createTask, deleteTask, getMyTasks, getTaskById, updateTask } from "../controllers/task.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createTaskSchema } from "../validators/task.validator.js";

const router = express.Router();

router.get("/", authenticatedToken, getMyTasks);
router.post("/create", authenticatedToken, validateBody(createTaskSchema), createTask);
router.patch("/update/:id", authenticatedToken, updateTask);
router.delete("/delete/:id", authenticatedToken, deleteTask);
router.get("/:id", authenticatedToken, getTaskById);

export default router;