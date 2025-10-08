import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import env from "../config/config.js";
import { JwtPayloadData } from "../types/types.js";

export const useAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decodedData = jwt.verify(token, env.JWT_SECRET) as JwtPayloadData;

    if (!decodedData) {
      console.log("Failed to decode user from token");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.user = decodedData;

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
