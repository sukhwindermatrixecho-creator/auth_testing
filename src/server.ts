import express from "express";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./auth/auth.routes.js";
import userRoutes from "./users/user.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.use(errorHandler);

app.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});