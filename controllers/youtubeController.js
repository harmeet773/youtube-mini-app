import axios from "axios";

const API_KEY = process.env.YT_API_KEY;
const CHANNELID = process.env.CHANNELID;

const youtubeController = {

  // ===============================
  // GET LATEST CHANNEL VIDEOS
  // ===============================
  async getChannelVideos(req, res) {         
  try {    
    const API_KEY = process.env.YT_API_KEY;
    const CHANNELID = process.env.CHANNELID;
    console.log("Fetching videos for channel ID:", CHANNELID,"del");
    if (!CHANNELID) {
      console.error("Channel ID not provided in .env");
      return res.status(400).json({ message: "Channel ID not provided in .env" });
    }

    // ===============================
    // STEP 1: Get uploads playlist ID
    // ===============================
    const channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          key: API_KEY,
          id: CHANNELID,
          part: "contentDetails"
        }
      }
    );
    console.log("Channel response data:", channelRes.data , "del");
    if (!channelRes.data.items?.length) {
      console.error("Channel not found");
      return res.status(404).json({ message: "Channel not found" });
    }

    const uploadsPlaylistId =
      channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

    // ===============================
    // STEP 2: Get video IDs (pagination)
    // ===============================
    let videoIds = [];
    let nextPageToken = "";
    console.log("Fetching videos from uploads playlist ID:", uploadsPlaylistId , "del");
    do {
      const playlistRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            key: API_KEY,
            playlistId: uploadsPlaylistId,
            part: "contentDetails",
            maxResults: 50,
            pageToken: nextPageToken
          }
        }
      );

      playlistRes.data.items.forEach(item => {
        videoIds.push(item.contentDetails.videoId);
      });

      nextPageToken = playlistRes.data.nextPageToken || "";
    } while (nextPageToken);

    // ===============================
    // STEP 3: Get full video details
    // ===============================
    let videos = [];
    console.log("Total video IDs fetched:", videoIds.length , "del");
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50).join(",");

      const videosRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            key: API_KEY,
            id: batchIds,
            part: "snippet,statistics,contentDetails"
          }
        }
      );

      videos.push(
        ...videosRes.data.items.map(video => ({
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.medium?.url,
          publishedAt: video.snippet.publishedAt,
          views: video.statistics.viewCount,
          likes: video.statistics.likeCount,
          comments: video.statistics.commentCount,
          duration: video.contentDetails.duration
        }))
      );
    }
    console.log("Total videos fetched with details:", videos.length , "del"); 
    res.json({
      success: true,
      totalVideos: videos.length,
      videos
    });

  } catch (err) {
    console.error("YouTube API Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
}
,

  // ===============================
  // GET SINGLE VIDEO DETAILS
  // ===============================
  async getVideoDetails(req, res) {
    try {
      const { videoId } = req.params;

      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            key: API_KEY,
            id: videoId,
            part: "snippet,statistics,contentDetails"
          }
        }
      );

      if (!response.data.items?.length) {
        return res.status(404).json({ message: "Video not found" });
      }

      res.json({   
        success: true,
        video: response.data.items[0]
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===============================
  // GET CHANNEL DETAILS
  // ===============================
  async getChannelDetails(req, res) {
    try {
      if (!CHANNELID) {
        return res.status(400).json({ message: "Channel ID not provided in .env" });
      }

      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            key: API_KEY,
            id: CHANNELID,
            part: "snippet,statistics"
          }
        }
      );

      if (!response.data.items?.length) {
        return res.status(404).json({ message: "Channel not found" });
      }

      res.json({
        success: true,
        channel: response.data.items[0]
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===============================
  // GET VIDEO COMMENTS
  // ===============================
 async getVideoComments(req, res) {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "videoId is required"
      });
    }

    let allComments = [];
    let nextPageToken = null;

    do {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/commentThreads",
        {
          params: {
            key: API_KEY,
            videoId,
            part: "snippet,replies",
            maxResults: 100, // API limit
            pageToken: nextPageToken
          }
        }
      );

      nextPageToken = response.data.nextPageToken;

      const items = response.data.items || [];

      items.forEach(item => {
        const top = item.snippet.topLevelComment.snippet;

        const comment = {
          commentThreadId: item.id,
          commentId: item.snippet.topLevelComment.id,

          // Text
          textDisplay: top.textDisplay,
          textOriginal: top.textOriginal,

          // Author
          authorName: top.authorDisplayName,
          authorProfileImage: top.authorProfileImageUrl,
          authorChannelId: top.authorChannelId?.value,
          authorChannelUrl: top.authorChannelUrl,

          // Meta
          likeCount: top.likeCount,
          publishedAt: top.publishedAt,
          updatedAt: top.updatedAt,
          viewerRating: top.viewerRating,
          canReply: item.snippet.canReply,
          totalReplyCount: item.snippet.totalReplyCount,
          isPublic: item.snippet.isPublic,

          // Replies (if any)
          replies: item.replies?.comments?.map(reply => ({
            replyId: reply.id,
            textDisplay: reply.snippet.textDisplay,
            textOriginal: reply.snippet.textOriginal,
            authorName: reply.snippet.authorDisplayName,
            authorChannelId: reply.snippet.authorChannelId?.value,
            likeCount: reply.snippet.likeCount,
            publishedAt: reply.snippet.publishedAt
          })) || []
        };

        allComments.push(comment);
      });

    } while (nextPageToken); // paginate to get ALL comments

    res.json({
      success: true,
      videoId,
      totalCommentsFetched: allComments.length,
      comments: allComments
    });

  } catch (err) {
    console.error("YouTube API Error:", err?.response?.data || err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: err?.response?.data || err.message
    });
  }
}
,
   async getUserProfile(req, res) {
    try {
      console.log("getUserProfile is called ,following data is being passesd", JSON.stringify(req.user) );     
      const {id,  email ,given_name , family_name ,picture } = req.user ; 
      res.json({id,  email ,given_name , family_name ,picture });
   
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

};

export default youtubeController;
