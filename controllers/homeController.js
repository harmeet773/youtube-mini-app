require("dotenv").config();

const axios = require("axios");

async function getVideoDetails(videoId) {
  const API_KEY = process.env.YT_API_KEY; // Load from .env
  const url = `https://www.googleapis.com/youtube/v3/videos`;

  try {
    const response = await axios.get(url, {
      params: {
        part: "snippet,contentDetails,statistics,status",
        id: videoId,
        key: API_KEY
      }
    });

    return response.data;
  } catch (err) {
    console.error("Error fetching video:", err.response?.data || err.message);
    return null;
  }
}

const index = async (req, res) => {
  const videoId = process.env.YT_VIDEO_ID;

  // Fetch details
  const details = await getVideoDetails(videoId);
console.log("API Response:", JSON.stringify(details, null, 2)); 
  // Send to view
  res.render("home", { details });
};

module.exports = { index };
