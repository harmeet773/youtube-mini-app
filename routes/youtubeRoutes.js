
import youtubeController from "../controllers/youtubeController.js";
import express from 'express';
const router = express.Router(); 

// -------------------- YOUTUBE ROUTES --------------------

// Get all videos of a channel
// GET /youtube/channel-videos?channelId=UCxxxx        
router.get("/channel-videos", youtubeController.getChannelVideos);      

// Get single video details       
// GET /youtube/video/:videoId
router.get("/video/:videoId", youtubeController.getVideoDetails);

// Get channel basic info
// GET /youtube/channel/:channelId
router.get("/channel/:channelId", youtubeController.getChannelDetails);

// Get comments of a video
// GET /youtube/video/:videoId/comments
router.get("/video/:videoId/comments", youtubeController.getVideoComments);

export default router;  


