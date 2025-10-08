// src/types/express.d.ts  (you can also keep it at root, but include it in tsconfig)
import { Request } from "express";
import { JwtPayloadData } from "./types.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayloadData;
  }
}
