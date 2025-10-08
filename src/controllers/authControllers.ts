import bcrypt from "bcrypt";
import { Users } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import env from "../config/config.js";
import crypto from "crypto";
import transporter from "../lib/transporter.js";
import { Request, Response } from "express";

export const registerNewUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Insufficient data recieved",
      });
    }

    // Check if user already exisis

    const isExist = await Users.findOne({
      email,
    });

    if (isExist) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered. Please login",
      });
    }

    //   Hashing password

    const hashedPassword = await bcrypt.hash(password, 10);

    //   Storing user in DB
    const user = await Users.create({
      name,
      email,
      passwordHash: hashedPassword,
    });

    // Generating a token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res
      .status(200)
      .cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({
        success: true,
        message: "User created successfully",
        userData: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if user exists
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send token in cookie
    res
      .status(200)
      .cookie("token", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({
        success: true,
        message: "Logged in successfully",
        userData: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const sendResetPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if user exists
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Hash OTP before saving
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save OTP and expiry (10 minutes)
    user.otp = hashedOtp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    user.restePasswordSession = false; // reset session flag
    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: env.USER_EMAIL,
      to: user.email,
      subject: "Reset Password OTP",
      text: `Your OTP for resetting password is: ${otp}. It expires in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const verifyResetPasswordOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find user
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one",
      });
    }

    // Check if OTP expired
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one",
      });
    }

    // Compare OTP
    const isValidOtp = await bcrypt.compare(otp, user.otp);
    if (!isValidOtp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Activate reset password session
    user.restePasswordSession = true;

    // Clear OTP fields so it can't be reused
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified. You can now reset your password",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    // Find user
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if reset password session is active
    if (!user.restePasswordSession) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please verify OTP first",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and deactivate reset session
    user.passwordHash = hashedPassword;
    user.restePasswordSession = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    res
      .status(200)
      .cookie("token", "", {
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getUserData = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      userData: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
