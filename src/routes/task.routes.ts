import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { bulkCreateTasks, createTask, deleteTask, getMyTasks, getTaskById, updateTask } from "../controllers/task.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { bulkCreateTaskSchema, createTaskSchema } from "../validators/task.validator.js";

const router = express.Router();

router.get("/", authenticatedToken, getMyTasks);
router.post("/create", authenticatedToken, validateBody(createTaskSchema), createTask);
router.post("/bulk", authenticatedToken, validateBody(bulkCreateTaskSchema), bulkCreateTasks);
router.patch("/update/:id", authenticatedToken, updateTask);
router.delete("/delete/:id", authenticatedToken, deleteTask);
router.get("/:id", authenticatedToken, getTaskById);

export default router;