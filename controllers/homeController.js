require("dotenv").config();  
const axios = require("axios");
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
  
  res.render("about");

}

const index = async (req, res) => {
  const videoId = process.env.YT_VIDEO_ID;
  // Fetch details (now returns { video, comments })
  const data = await getVideoDetails(videoId);
  res.render("home", {
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

module.exports = { index, register, addReply, deleteComment, editComment , addComment , about};

