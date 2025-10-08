import cors from "cors";
import express, { Request, Response } from "express";
import env from "./config/config.js";
import connectDb from "./lib/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import cookieParser from "cookie-parser";

const server = express();

// USING CORS
server.use(
  cors({
    origin: [env.FRONTEND_ROUTE],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// USING MIDDLEWARES
server.use(express.json());
server.use(cookieParser());

// TEST ROUTE
server.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// USING ROUTES
server.use("/api/v1/auth", authRoutes);
server.use("/api/v1/post", postRoutes);

// Starting the server as an IIFE function
(async () => {
  connectDb();
  server.listen(env.PORT, () => console.log(`listening ${env.PORT}`));
})();
