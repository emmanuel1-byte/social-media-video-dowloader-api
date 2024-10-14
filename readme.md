# Social Media Video Downloader API

Welcome to the **Social Media Video Downloader API**! 🚀

This API allows you to effortlessly download videos from popular social media platforms. Just provide the video URL, and let the API handle the rest!

## Features

- **Simple URL Input:** Paste any supported video URL.
- **Easy Downloads:** Download your favorite videos with just a few clicks.

## Usage

To download a video, make a POST request to the `/api/download` endpoint with the video URL in the request body.

**Example Request:**

```json
{
  "video_url": "https://example.com/video"
}
