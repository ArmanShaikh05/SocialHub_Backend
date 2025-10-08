import express from "express";

import { useAuth } from "../middleware/useAuth.js";
import {
  createNewComment,
  createNewPost,
  createNewReply,
  deleteUserPost,
  getAllPosts,
  getAllUserPosts,
  getImagekitOptions,
  getRecommendedUsers,
  togglePostLikes,
  updateUserPost,
} from "../controllers/postControllers.js";

const router = express.Router();

router.get("/get-imagekit-options", useAuth, getImagekitOptions);
router.get("/recommended-users",useAuth,getRecommendedUsers)
router.get("/all-posts", useAuth, getAllPosts);
router.get("/user-posts", useAuth, getAllUserPosts);
router.post("/create-post", useAuth, createNewPost);
router.post("/create-comment", useAuth, createNewComment);
router.post("/create-comment-reply", useAuth, createNewReply);
router.post("/toggle-like", useAuth, togglePostLikes);
router.post("/update-user-post", useAuth, updateUserPost);
router.delete("/delete-user-post/:postId", useAuth, deleteUserPost);

export default router;
