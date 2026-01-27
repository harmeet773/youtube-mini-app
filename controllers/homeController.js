import "dotenv/config";
import axios from "axios";
async function addReplyToComment(parentId, text, accessToken) {
  const url = "https://www.googleapis.com/youtube/v3/comments";

  return axios.post(
    url,   
    {
      snippet: {
        parentId: parentId,
        textOriginal: text
      }
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      params: {
        part: "snippet"
      }
    }     
  );
}
// this function takes videoID and returns video details as well as comments.
async function getVideoDetails(videoId) {
  const API_KEY = process.env.YT_API_KEY;
  const baseUrl = "https://www.googleapis.com/youtube/v3";
  try {
    // 1. Fetch video details
    const videoRes = await axios.get(`${baseUrl}/videos`, {
      params: {
        part: "snippet,contentDetails,statistics,status",
        id: videoId,
        key: API_KEY
      }
    });

    // 2. Fetch comments for this video
    const commentsRes = await axios.get(`${baseUrl}/commentThreads`, {
      params: {
        part: "snippet,replies",
        videoId: videoId,
        maxResults: 100,
        key: API_KEY
      }       
    });
    return {
      video: videoRes.data,
      comments: commentsRes.data.items || []
    };
  } catch (err) {
    console.error("Error fetching video:", err.response?.data || err.message);
    return null;
  }
}

const about = async (req,res) => {

  res.json({ message: "About page" });

}

const index = async (req, res) => {
  const videoId = process.env.YT_VIDEO_ID;
  // Fetch details (now returns { video, comments })
  const data = await getVideoDetails(videoId);
  res.json({
    video: data?.video || null,
    comments: data?.comments || [],
    user: req.user
  });
};   
const register = async (req, res) => {
  // Send to view
  res.render("register");
};

const addReply = async (req, res) => {
  const { parentId, replyText } = req.body;

  if (!req.user?.access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const response = await addReplyToComment(parentId, replyText, req.user.access_token);

    return res.json({
      success: true,
      reply: response.data
    });

  } catch (err) {
    console.error("Reply error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to post reply" });
  }
};

// DELETE COMMENT
async function deleteComment(req, res) {
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
}

async function addComment(req, res){         
  try {
    const { videoId, commentText } = req.body;

    if (!req.user?.access_token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const accessToken = req.user.access_token;

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
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.json({
      success: true,
      comment: response.data
    });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    return res.status(500).json({ error: "Failed to post comment" });
  }
}

// EDIT COMMENT
async function editComment(req, res) {
  const { commentId, newText } = req.body;

  if (!req.user?.access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const response = await axios.put(
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
}

async function serverStatus( req , res ) {
  res.json("server is running");
  
}

// LIKE/DISLIKE (SET RATING) FOR COMMENT
async function setCommentRating(req, res) {
  let { commentId, rating } = req.body; // rating can be 'like', 'dislike', or 'none'

  if (!req.user?.access_token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // If commentId starts with "Ug", it's likely a CommentThread ID.
  // The setRating API requires the top-level comment ID, which usually 
  // starts with "Ug" but it's the SAME as the thread ID if we are liking the top comment.
  // HOWEVER, sometimes the thread ID and top-level comment ID are slightly different in structure
  // although YouTube usually accepts the thread ID for setRating if it's a top-level comment.
  // Let's ensure we have a valid ID.

  try {
    console.log(`Setting rating "${rating}" for comment ID: ${commentId}`);
    
    await axios.post(
      "https://www.googleapis.com/youtube/v3/comments/setRating",
      null,
      {
        params: {
          id: commentId,
          rating: rating
        },
        headers: { Authorization: `Bearer ${req.user.access_token}` }
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Comment rating error detail:", err.response?.data || err.message);
    if (err.response?.data) {
        console.error("YouTube API Error Response:", JSON.stringify(err.response.data, null, 2));
    }
    
    // If it's a 400 error, it might be an invalid ID.
    return res.status(err.response?.status || 500).json({ 
        error: "Failed to set comment rating", 
        details: err.response?.data || err.message 
    });
  }
}

// LIKE/DISLIKE (SET RATING) FOR VIDEO
async function setVideoRating(req, res) {
  const { videoId, rating } = req.body; // rating can be 'like', 'dislike', or 'none'

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
}

export default { serverStatus,index, register, addReply, deleteComment, editComment , addComment , about, setCommentRating, setVideoRating};

