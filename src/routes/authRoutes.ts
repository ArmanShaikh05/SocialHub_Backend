import express from "express";
import {
  getUserData,
  loginUser,
  logoutUser,
  registerNewUser,
  resetPassword,
  sendResetPasswordOtp,
  verifyResetPasswordOtp
} from "../controllers/authControllers.js";
import { useAuth } from "../middleware/useAuth.js";

const router = express.Router();

router.get("/get-user-data", useAuth, getUserData);
router.post("/register", registerNewUser);
router.post("/login", loginUser);
router.post("/send-otp", sendResetPasswordOtp);
router.post("/verify-otp", verifyResetPasswordOtp);
router.post("/reset-password", resetPassword);
router.get("/logout", useAuth, logoutUser);

export default router;
