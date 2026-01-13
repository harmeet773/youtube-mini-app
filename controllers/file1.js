const API_KEY = "YOUR_API_KEY";
const CHANNEL_ID = "UCxxxxxxxx";

async function getAllVideos() {
  // Step 1: Get uploads playlist
  const channelRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`
  );
  const channelData = await channelRes.json();
  const uploadsPlaylistId =
    channelData.items[0].contentDetails.relatedPlaylists.uploads;

  let videoIds = [];
  let nextPageToken = "";

  // Step 2: Get video IDs
  do {
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`
    );
    const playlistData = await playlistRes.json();

    playlistData.items.forEach(item => {
      videoIds.push(item.contentDetails.videoId);
    });

    nextPageToken = playlistData.nextPageToken || "";
  } while (nextPageToken);

  // Step 3: Get video details (batch of 50)
  const videoDetails = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const ids = videoIds.slice(i, i + 50).join(",");
    const videoRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${API_KEY}`
    );
    const videoData = await videoRes.json();
    videoDetails.push(...videoData.items);
  }

  return videoDetails;
}

getAllVideos().then(console.log);
 