import axios from "axios";

// ===============================
// HELPERS FOR COMMENTS
// ===============================

/**
 * Maps a single YouTube comment resource (reply) to our clean JSON format.
 */
const mapReply = (reply) => {
  const snippet = reply.snippet || {};
  return {
    replyId: reply.id,
    parentId: snippet.parentId,
    textDisplay: snippet.textDisplay || snippet.textOriginal || "",
    textOriginal: snippet.textOriginal || snippet.textDisplay || "",
    authorName: snippet.authorDisplayName,
    authorProfileImage: snippet.authorProfileImageUrl,
    authorChannelId: snippet.authorChannelId?.value,
    authorChannelUrl: snippet.authorChannelUrl,
    likeCount: snippet.likeCount,
    publishedAt: snippet.publishedAt,
    updatedAt: snippet.updatedAt,
    viewerRating: snippet.viewerRating,
  };
};

/**
 * Fetches ALL replies for a specific comment thread using pagination.
 */
async function fetchAllReplies(parentId, apiKey) {
  let allReplies = [];
  let nextPageToken = "";
  try {
    do {
      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/comments",
        {
          params: {
            key: apiKey,
            parentId: parentId,
            part: "snippet",
            maxResults: 100,
            pageToken: nextPageToken || undefined,
          },
        }
      );
      allReplies.push(...(response.data?.items || []));
      nextPageToken = response.data?.nextPageToken || "";
    } while (nextPageToken);
  } catch (err) {
    console.error(`Error fetching replies for thread ${parentId}:`, err.response?.data || err.message);
  }
  return allReplies;
}

const youtubeController = {

  // ===============================
  // GET LATEST CHANNEL VIDEOS
  // ===============================
  async getChannelVideos(req, res) {         
  try {    
    const apiKey = process.env.YT_API_KEY;
    const channelId = process.env.CHANNELID;

    console.log("Fetching videos for channel ID:", channelId);
    if (!channelId) {
      console.error("Channel ID not provided in .env");
      return res.status(400).json({ message: "Channel ID not provided in .env" });
    }

    if (!apiKey) {
      console.error("YT_API_KEY not provided in .env");
      return res.status(500).json({ message: "YT_API_KEY not provided in .env" });
    }

    // ===============================
    // STEP 1: Get uploads playlist ID
    // ===============================
    const channelRes = await axios.get(
      "https://www.googleapis.com/youtube/v3/channels",
      {
        params: {
          key: apiKey,
          id: channelId,
          part: "contentDetails"
        }
      }
    );
    
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
    console.log("Fetching videos from uploads playlist ID:", uploadsPlaylistId);
    
    do {
      const playlistRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/playlistItems",
        {
          params: {
            key: apiKey,
            playlistId: uploadsPlaylistId,
            part: "contentDetails",
            maxResults: 50,
            pageToken: nextPageToken || undefined
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
    console.log("Total video IDs fetched:", videoIds.length);
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50).join(",");

      const videosRes = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            key: apiKey,
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
    
    res.json({
      success: true,
      totalVideos: videos.length,
      videos
    });

  } catch (err) {
    console.error("YouTube API Error:", err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: err.message });
  }
}
,

  // ===============================
  // GET SINGLE VIDEO DETAILS
  // ===============================
  async getVideoDetails(req, res) {
    try {
      const { videoId } = req.params;
      const apiKey = process.env.YT_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ message: "YT_API_KEY is missing" });
      }

      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/videos",
        {
          params: {
            key: apiKey,
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
      res.status(err.response?.status || 500).json({ error: err.message });
    }
  },

  // ===============================
  // GET CHANNEL DETAILS
  // ===============================
  async getChannelDetails(req, res) {
    try {
      const apiKey = process.env.YT_API_KEY;
      const channelId = process.env.CHANNELID;

      if (!channelId) {
        return res.status(400).json({ message: "Channel ID not provided in .env" });
      }
      if (!apiKey) {
        return res.status(500).json({ message: "YT_API_KEY is missing" });
      }

      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/channels",
        {
          params: {
            key: apiKey,
            id: channelId,
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
      res.status(err.response?.status || 500).json({ error: err.message });
    }
  },

  // ===============================
  // GET VIDEO COMMENTS
  // ===============================
  async getVideoComments(req, res) {
    const { videoId } = req.params;
    const apiKey = process.env.YT_API_KEY;

    if (!apiKey) {
      console.error("YT_API_KEY is missing in .env");
      return res.status(500).json({
        success: false,
        message: "YT_API_KEY is missing"
      });
    }

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: "videoId is required"
      });
    }

    try {
      let allComments = [];
      let nextPageToken = "";
      let totalFetchedItems = 0;

      console.log(`[YouTube API] Fetching comments for video: ${videoId}...`);

      // Fetch all comment threads (top-level comments)
      do {
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/commentThreads",
          {
            params: {
              key: apiKey,
              videoId,
              part: "snippet,replies",
              maxResults: 100,
              pageToken: nextPageToken || undefined
            }
          }
        );

        const items = response.data?.items || [];
        
        // Map threads and fetch full replies if needed
        const mappedComments = await Promise.all(items.map(async (item) => {
          const top = item.snippet?.topLevelComment?.snippet;
          if (!top) return null;

          let replies = [];
          const totalReplyCount = item.snippet?.totalReplyCount || 0;
          const initialReplies = item.replies?.comments || [];

          // YouTube API includes up to 5 replies in the thread resource.
          // If totalReplyCount > returned replies, fetch all using comments.list properly.
          if (totalReplyCount > 0) {
            if (initialReplies.length < totalReplyCount) {
              const fullReplies = await fetchAllReplies(item.id, apiKey);
              replies = fullReplies.map(mapReply);
            } else {
              replies = initialReplies.map(mapReply);
            }
          }

          return {
            commentThreadId: item.id,
            commentId: item.snippet?.topLevelComment?.id || item.id,
            textDisplay: top.textDisplay || top.textOriginal || "",
            textOriginal: top.textOriginal || top.textDisplay || "",
            authorName: top.authorDisplayName,
            authorProfileImage: top.authorProfileImageUrl,
            authorChannelId: top.authorChannelId?.value,
            authorChannelUrl: top.authorChannelUrl,
            likeCount: top.likeCount,
            publishedAt: top.publishedAt,
            updatedAt: top.updatedAt,
            viewerRating: top.viewerRating,
            canReply: item.snippet?.canReply,
            totalReplyCount: totalReplyCount,
            isPublic: item.snippet?.isPublic,
            replies: replies
          };
        }));

        const filteredComments = mappedComments.filter(Boolean);
        allComments.push(...filteredComments);
        
        // Update total count for metrics
        filteredComments.forEach(c => {
          totalFetchedItems += 1; // The top-level comment
          totalFetchedItems += (c.replies?.length || 0); // All its replies
        });

        nextPageToken = response.data?.nextPageToken || "";
        if (nextPageToken) {
           console.log(`[YouTube API] Fetched ${allComments.length} threads so far, moving to next page...`);
        }

      } while (nextPageToken);

      console.log(`[YouTube API] Finished fetching. Total threads: ${allComments.length}, Total comments (including replies): ${totalFetchedItems}`);

      return res.json({
        success: true,
        videoId,
        totalThreadsFetched: allComments.length,
        totalCommentsFetched: totalFetchedItems,
        comments: allComments
      });

    } catch (err) {
      const errorResponse = err?.response?.data?.error;
      const reason = errorResponse?.errors?.[0]?.reason;

      if (reason === "commentsDisabled") {
        return res.json({
          success: true,
          videoId,
          totalThreadsFetched: 0,
          totalCommentsFetched: 0,
          comments: [],
          message: "Comments are disabled for this video"
        });
      }

      console.error("YouTube API Error:", errorResponse || err.message);

      return res.status(err.response?.status || 500).json({
        success: false,
        message: "Failed to fetch comments",
        error: errorResponse || err.message
      });
    }
  },

  async getUserProfile(req, res) {
    try {
      console.log("getUserProfile is called ,following data is being passesd", JSON.stringify(req.user) );
      const {id,  email ,given_name , family_name ,picture } = req.user ;
      res.json({id,  email ,given_name , family_name ,picture });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===============================
  // SERVER STATUS
  // ===============================
  async serverStatus(req, res) {
    res.json({ status: "ok", message: "Server is running" });
  },

  // ===============================
  // GET VIDEO WITH COMMENTS (HOME)
  // ===============================
  async getHomeVideo(req, res) {
    const videoId = process.env.YT_VIDEO_ID;
    const apiKey = process.env.YT_API_KEY;

    if (!videoId || !apiKey) {
      return res.status(500).json({ error: "Video ID or API key missing" });
    }

    try {
      // Fetch video details
      const videoRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "snippet,contentDetails,statistics,status",
          id: videoId,
          key: apiKey
        }
      });

      // Fetch comments for this video
      const commentsRes = await axios.get("https://www.googleapis.com/youtube/v3/commentThreads", {
        params: {
          part: "snippet,replies",
          videoId: videoId,
          maxResults: 100,
          key: apiKey
        }
      });

      res.json({
        video: videoRes.data,
        comments: commentsRes.data.items || [],
        user: req.user || null
      });
    } catch (err) {
      console.error("Error fetching home video:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to fetch video details" });
    }
  },

  // ===============================
  // ADD REPLY TO COMMENT
  // ===============================
  async addReply(req, res) {
    const { parentId, replyText } = req.body;

    if (!req.user?.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const response = await axios.post(
        "https://www.googleapis.com/youtube/v3/comments",
        {
          snippet: {
            parentId: parentId,
            textOriginal: replyText
          }
        },
        {
          headers: {
            Authorization: `Bearer ${req.user.access_token}`,
            "Content-Type": "application/json"
          },
          params: {
            part: "snippet"
          }
        }
      );

      return res.json({
        success: true,
        reply: response.data
      });
    } catch (err) {
      console.error("Reply error:", err.response?.data || err.message);
      return res.status(500).json({ error: "Failed to post reply" });
    }
  },

  // ===============================
  // DELETE COMMENT
  // ===============================
  async deleteComment(req, res) {
    const { commentId } = req.body;

    if (!req.user?.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      await axios.delete("https://www.googleapis.com/youtube/v3/comments", {
        params: { id: commentId },
        headers: { Authorization: `Bearer ${req.user.access_token}` }
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      return res.status(500).json({ error: "Failed to delete comment" });
    }
  },

  // ===============================
  // ADD COMMENT
  // ===============================
  async addComment(req, res) {
    try {
      const { videoId, commentText } = req.body;

      if (!req.user?.access_token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const response = await axios.post(
        "https://www.googleapis.com/youtube/v3/commentThreads?part=snippet",
        {
          snippet: {
            videoId,
            topLevelComment: {
              snippet: { textOriginal: commentText }
            }
          }
        },
        { headers: { Authorization: `Bearer ${req.user.access_token}` } }
      );

      return res.json({
        success: true,
        comment: response.data
      });
    } catch (error) {
      console.error(error?.response?.data || error.message);
      return res.status(500).json({ error: "Failed to post comment" });
    }
  },

  // ===============================
  // EDIT COMMENT
  // ===============================
  async editComment(req, res) {
    const { commentId, newText } = req.body;

    if (!req.user?.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      await axios.put(
        "https://www.googleapis.com/youtube/v3/comments",
        {
          id: commentId,
          snippet: { textOriginal: newText }
        },
        {
          params: { part: "snippet" },
          headers: { Authorization: `Bearer ${req.user.access_token}` }
        }
      );

      return res.json({
        success: true,
        newText
      });
    } catch (err) {
      console.error("Edit error:", err.response?.data || err.message);
      return res.status(500).json({ error: "Failed to edit comment" });
    }
  },

  // ===============================
  // SET COMMENT RATING (LIKE/DISLIKE)
  // ===============================
  async setCommentRating(req, res) {
    const { commentId, rating } = req.body;

    if (!req.user?.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // NOTE: The YouTube Data API v3 does not currently support setting ratings (like/dislike) on comments.
      // Calling 'https://www.googleapis.com/youtube/v3/comments/setRating' results in a 404 error.
      // To provide a smooth user experience, we will simulate success here, allowing the frontend to update its UI.
      
      console.log(`Simulating comment rating (${rating}) for commentId: ${commentId}`);

      return res.json({ 
        success: true, 
        message: "Comment rating not supported by YouTube API",
        commentId,
        rating
      });
    } catch (err) {
      console.error("Comment rating error:", err.response?.data || err.message);
      return res.status(500).json({
        error: "Failed to set comment rating",
        details: err.response?.data || err.message
      });
    }
  },

  // ===============================
  // SET VIDEO RATING (LIKE/DISLIKE)
  // ===============================
  async setVideoRating(req, res) {
    const { videoId, rating } = req.body;

    if (!req.user?.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      await axios.post(
        "https://www.googleapis.com/youtube/v3/videos/rate",
        null,
        {
          params: {
            id: videoId,
            rating: rating
          },
          headers: { Authorization: `Bearer ${req.user.access_token}` }
        }
      );

      return res.json({ success: true });
    } catch (err) {
      console.error("Video rating error:", err.response?.data || err.message);
      return res.status(500).json({ error: "Failed to set video rating" });
    }
  },

  // ===============================
  // ABOUT
  // ===============================
  async about(req, res) {
    res.json({ message: "About page - YouTube Clone API" });
  }

};

export default youtubeController;
