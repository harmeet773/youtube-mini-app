
import youtubeController from "../controllers/youtubeController.js";
import express from 'express';
const router = express.Router();

// -------------------- YOUTUBE ROUTES --------------------

// Server status
// GET /api/serverStatus
router.get("/serverStatus", youtubeController.serverStatus);

// Home page - get video with comments
// GET /api/
router.get("/", youtubeController.getHomeVideo);

// About page
// GET /api/about
router.get("/about", youtubeController.about);

// Get user profile
// GET /api/getUserProfile
router.get("/getUserProfile", youtubeController.getUserProfile);

// Get all videos of a channel
// GET /api/channel-videos
router.get("/channel-videos", youtubeController.getChannelVideos);

// Get single video details
// GET /api/video/:videoId
router.get("/video/:videoId", youtubeController.getVideoDetails);

// Get channel basic info
// GET /api/channel/:channelId
router.get("/channel/:channelId", youtubeController.getChannelDetails);

// Get comments of a video
// GET /api/video/:videoId/comments
router.get("/video/:videoId/comments", youtubeController.getVideoComments);

// -------------------- COMMENT & VIDEO INTERACTION ROUTES --------------------

// Add reply to comment
// POST /api/reply-comment
router.post("/reply-comment", youtubeController.addReply);

// Delete comment
// POST /api/delete-comment
router.post("/delete-comment", youtubeController.deleteComment);

// Edit comment
// POST /api/edit-comment
router.post("/edit-comment", youtubeController.editComment);

// Add comment
// POST /api/add-comment
router.post("/add-comment", youtubeController.addComment);

// Set comment rating (like/dislike)
// POST /api/comment-rating
router.post("/comment-rating", youtubeController.setCommentRating);

// Set video rating (like/dislike)
// POST /api/video-rating
router.post("/video-rating", youtubeController.setVideoRating);

export default router;

