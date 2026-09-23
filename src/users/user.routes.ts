import express from "express";
import { authenticatedToken } from "../middlewares/auth.middleware.js";
import { requiredRole } from "../middlewares/role.middleware.js";
import { Role } from "../generated/prisma/enums.js";

const router = express.Router();

router.get('/admin-only', authenticatedToken, requiredRole(Role.ADMIN), (req, res) => {
    return res.json({
        message: "Welcome admin!",
    });
});

export default router;