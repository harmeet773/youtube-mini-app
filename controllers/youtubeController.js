import axios from "axios";

const API_KEY = process.env.YOUTUBE_API_KEY;

const youtubeController = {

  async getChannelVideos(req, res) {
    try {
      const channelId = process.env.channelId;

      if (!channelId) {
        return res.status(400).json({ message: "Channel ID not provided" });
      }

      const response = await axios.get(`https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=10`);

      res.json({ success: true, videos: response.data.items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getVideoDetails(req, res) {
    try {
      const { videoId } = req.params;
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoId}&part=snippet,statistics`);
      res.json({ success: true, video: response.data.items[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
async getChannelDetails(req, res) {
  try {
    const channelId = process.env.channelId;

    if (!channelId) {
      return res.status(400).json({ message: "Channel ID not provided" });
    }

    const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&id=${channelId}&part=snippet,statistics`);

    res.json({
      success: true,
      channel: response.data.items[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} ,


  async getVideoComments(req, res) {
    try {
      const { videoId } = req.params;
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads?key=${API_KEY}&videoId=${videoId}&part=snippet&maxResults=10`);
      res.json({ success: true, comments: response.data.items });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

};

export default youtubeController;
