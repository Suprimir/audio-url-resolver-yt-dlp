import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import ytdlp from "yt-dlp-exec";
import os from "os";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";

const app = express();
const PORT = 3001;
const SONGS_DIR = path.resolve("./songs");

if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

app.use(cors());

app.get("/download-audio", async (req: Request, res: Response) => {
  const videoId = req.query.videoId as string;
  const title = req.query.title as string;

  if (!videoId) {
    res.status(400).json({ error: "Missing videoId" });
    return;
  }

  let filepath: string | null = null;

  try {
    const sanitizedTitle = (title || videoId)
      .replace(/[\/\\?%*:|"<>]/g, "-")
      .substring(0, 50);
    const filename = `${sanitizedTitle}-${videoId}-${Date.now()}.mp3`;
    filepath = path.join(SONGS_DIR, filename);

    await ytdlp(`https://www.youtube.com/watch?v=${videoId}`, {
      extractAudio: true,
      audioFormat: "mp3",
      audioQuality: 0,
      output: filepath,
      preferFreeFormats: true,
      noWarnings: true,
      ffmpegLocation: ffmpegPath ?? "",
    });

    if (!fs.existsSync(filepath)) {
      throw new Error("File was not created");
    }

    const stats = fs.statSync(filepath);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": stats.size.toString(),
      "Content-Disposition": `attachment; filename="${sanitizedTitle}.mp3"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    });

    const stream = fs.createReadStream(filepath);

    const cleanup = () => {
      if (filepath && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`File downloaded an deleted: ${filepath}`);
      }
    };

    stream.on("end", cleanup);
    stream.on("error", cleanup);
    res.on("close", cleanup);
    res.on("finish", cleanup);

    stream.pipe(res);
  } catch (err) {
    console.error("Download error:", err);

    if (filepath && fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
        console.log(`File deleted after error: ${filepath}`);
      } catch (deleteErr) {
        console.error(
          `Failed to delete file after error: ${filepath}`,
          deleteErr
        );
      }
    }

    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to download audio" });
    }
  }
});

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
      audioFormat: "mp3",
      format: "bestaudio[ext=m4a]/bestaudio",
      ffmpegLocation: ffmpegPath ?? "",
      noPlaylist: true,
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
