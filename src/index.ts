import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import ytdlp from "yt-dlp-exec";
import os from "os";

const app = express();
const PORT = 3001;
const SONGS_DIR = path.resolve("./songs");

app.use(cors());

app.get("/get-audio-url", async (req: Request, res: Response) => {
  const videoId = req.query.videoId as string;

  if (!videoId) {
    res.status(400).json({ error: "Missing videoId" });
  }

  try {
    const info = await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      extractAudio: true,
      audioFormat: "mp3",
    });

    const audioUrl = info?.url;

    if (!audioUrl) {
      throw new Error("No audio URL found");
    }

    res.json({ audioUrl });
  } catch (err) {
    console.error("yt-dlp error:", err);
    res.status(500).json({ error: "Failed to extract audio URL" });
  }
});

app.use("/songs", express.static(SONGS_DIR));

app.listen(PORT, () => {
  const interfaces = os.networkInterfaces();
  const localIp =
    Object.values(interfaces)
      .flat()
      .find((iface) => iface?.family === "IPv4" && !iface.internal)?.address ||
    "localhost";

  console.log(`✅ API running at:`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → http://${localIp}:${PORT}`);
});
