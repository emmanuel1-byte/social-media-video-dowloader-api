const express = require("express");
const app = express();

const { createServer } = require("http");
const server = createServer(app);

require("dotenv").config();
const youtubedl = require("youtube-dl-exec");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY } =
  process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_SECRET_KEY,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
});

app.use(cors());
app.use(helmet());
app.use(limiter)

app.get("/", (req, res) => {
  res.status(200).json({ message: "API is healthy and running.." });
});

app.post("/api/download", async (req, res, next) => {
  const { video_url } = req.body;
  if (!video_url) {
    return res
      .status(400)
      .json({ message: "Please provide a valid URL to download the video." });
  }

  const outputPath = path.resolve(__dirname, "downloaded_video"); // Base name for output
  const tempOutputPath = `${outputPath}.%(ext)s`; // Temporary file for download

  try {
    // Download the video using youtube-dl
    const output = await youtubedl(video_url, {
      output: tempOutputPath, // Temporary file with extension placeholder
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    });

    console.log("Download Output:", output); // Debugging purposes

    // Look for the downloaded file by checking different formats
    const extensions = ["mp4", "mkv", "webm"]; // Common formats
    let downloadedFilePath;
    for (let ext of extensions) {
      const filePath = `${outputPath}.${ext}`;
      if (fs.existsSync(filePath)) {
        downloadedFilePath = filePath;
        break;
      }
    }

    if (!downloadedFilePath) {
      return res
        .status(500)
        .json({ message: "Video file not found after download." });
    }

    console.log(`Downloaded file path: ${downloadedFilePath}`);

    // Upload to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(
      downloadedFilePath,
      {
        resource_type: "video",
        folder: "social_media_video_downloader",
        format: "mp4", // Cloudinary will convert to mp4
      }
    );

    fs.unlinkSync(downloadedFilePath);

    res.status(200).json({ data: { url: cloudinaryResponse.url } });
  } catch (err) {
    next(err);
  }
});

app.use("*", (req, res) => {
  res
    .status(404)
    .json({ message: "Requested endpoint does not exist on this server" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Inernal Server Error" });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
