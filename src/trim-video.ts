import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";
import axios from "axios";

//Trim a random part of 15min minecraft parkour video
export async function trimParkourVideo(
  secondsToTrim: number,
  outputVideo: string
): Promise<void> {
  const ffprobe = promisify(ffmpeg.ffprobe);

  const id = uuidv4();
  const tempVideo = `temp_video_${id}.mp4`;

  const response = await axios({
    url: "https://utfs.io/f/h9Kc08GEMk0gMqNYm2CUbPeN8KpsduOXo90Mf4YnVmgkD3c1",
    method: "GET",
    responseType: "stream",
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(tempVideo);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  const metadata: any = await ffprobe(tempVideo);
  const duration = metadata.format.duration;

  const maxStart = Math.max(0, duration - secondsToTrim);
  const startTime = Math.floor(Math.random() * maxStart);

  return new Promise((resolve, reject) => {
    ffmpeg(tempVideo)
      .setStartTime(startTime)
      .setDuration(secondsToTrim)
      .output(outputVideo)
      .on("end", () => {
        console.log("Video trimmed and saved as:", outputVideo);
        fs.unlinkSync(tempVideo);

        resolve();
      })
      .on("error", (err) => {
        console.error("Error trimming the video:", err);
        fs.unlinkSync(tempVideo);

        reject(err);
      })
      .run();
  });
}
