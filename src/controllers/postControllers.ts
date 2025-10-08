import { Request, Response } from "express";
import imagekit from "../lib/imagekit.js";
import { PostModel } from "../models/postsModel.js";
import { CommentModel } from "../models/commentsModel.js";
import { Users } from "../models/userModel.js";

export const getImagekitOptions = async (req: Request, res: Response) => {
  try {
    const { token, expire, signature } = imagekit.getAuthenticationParameters();

    if (!token || !expire || !signature) {
      return res.status(400).json({
        success: false,
        message: "Failed to geberate imagekit options",
      });
    }

    res.status(200).json({
      success: true,
      data: { token, expire, signature },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const createNewPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { content, imageUrl, imageId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    await PostModel.create({
      user: user?.id,
      content,
      imageUrl,
      imageId,
      likes: [],
      comments: [],
    });

    res.status(200).json({
      success: true,
      message: "post created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const allPosts = await PostModel.find()
      .populate({
        path: "user",
        select: "name email _id",
      })
      .populate({
        path: "likes",
        select: "name email _id",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user replies.user",
          select: "name email _id",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "all posts fetched successfully",
      posts: allPosts || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getAllUserPosts = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const userPosts = await PostModel.find({
      user: user.id,
    })
      .populate({
        path: "user",
        select: "name email _id",
      })
      .populate({
        path: "likes",
        select: "name email _id",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user replies.user",
          select: "name email _id",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "all user posts fetched successfully",
      posts: userPosts || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const createNewComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { post, text } = req.body;

    if (!post || !text) {
      return res.status(400).json({
        success: false,
        message: "Post and text are required",
      });
    }

    // Creating New Comment

    const newComment = await CommentModel.create({
      user: user.id,
      post,
      text,
      replies: [],
    });

    if (!newComment) {
      return res.status(400).json({
        success: false,
        message: "Failed to create comment",
      });
    }

    // Adding the comment to post

    await PostModel.findByIdAndUpdate(post, {
      $push: {
        comments: newComment._id,
      },
    });

    res.status(200).json({
      success: true,
      message: "comment created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const createNewReply = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { commentId, text } = req.body;

    if (!commentId || !text) {
      return res.status(400).json({
        success: false,
        message: "commentId and text are required",
      });
    }

    // Creating New Reply

    await CommentModel.findByIdAndUpdate(commentId, {
      $push: {
        replies: {
          user: user.id,
          text,
        },
      },
    });
    res.status(200).json({
      success: true,
      message: "reply created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const togglePostLikes = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "postId is required",
      });
    }

    // Add the user Id to liked users array

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "post not found",
      });
    }

    // handle like unlike logic

    const isLiked =
      post.likes.findIndex(
        (likedUser) => likedUser._id.toString() === user.id
      ) !== -1;

    if (isLiked) {
      await PostModel.findByIdAndUpdate(postId, {
        $pull: { likes: user.id },
      });
    } else {
      await PostModel.findByIdAndUpdate(postId, {
        $addToSet: { likes: user.id },
      });
    }

    res.status(200).json({
      success: true,
      message: "like on post toggled successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const updateUserPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { postId, content, imageUrl, imageId, deleteOldImage } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "postId is required",
      });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Content cannot be empty in a post",
      });
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "post not found",
      });
    }

    // Handle image managing

    // Case 1: When user wants to delete old image and upload new image

    if (deleteOldImage && imageUrl !== "" && imageId !== "") {
      // Deleting old image

      if (post.imageId) {
        await imagekit.deleteFile(post.imageId);
      }

      // Update database with new imageId and imageUrl

      post.imageId = imageId;
      post.imageUrl = imageUrl;
    }

    // Case 2: When user wants to delete old image but not upload new image

    if (deleteOldImage && imageUrl === "" && imageId === "") {
      if (post.imageId) {
        await imagekit.deleteFile(post.imageId);
      }

      post.imageId = "";
      post.imageUrl = "";
    }

    // Updating content
    post.content = content;

    // Saving the updated user
    await post.save();

    res.status(200).json({
      success: true,
      message: "user post updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const deleteUserPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "postId is required",
      });
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(400).json({
        success: false,
        message: "post not found",
      });
    }

    // Delete all post comments

    await CommentModel.deleteMany({
      post: post._id,
    });

    // Delete the image from imagekit if present
    if (post.imageId) {
      await imagekit.deleteFile(post.imageId);
    }

    // Delete actual post

    await PostModel.deleteOne({
      _id: postId,
      user: user.id,
    });

    res.status(200).json({
      success: true,
      message: "user post deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getRecommendedUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const allUsers = await Users.find().sort({ createdAt: -1 }).limit(10);

    const recommendedUsers = allUsers.filter((u) => u._id.toString() !== user.id);

    res.status(200).json({
      success: true,
      message: "all recommended users fetched successfully",
      users: recommendedUsers || [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
