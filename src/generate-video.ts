import { createTimestampedAudioFromText } from "./11labs";
import { generateSRT } from "./generate-srt";
import { trimParkourVideo } from "./trim-video";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

export const generateVideo = async (text: string) => {
  const videoId = uuidv4();
  const audioFilePath = `output_audio_${videoId}.mp3`;
  const srtFilePath = `captions_${videoId}.srt`;
  const videoFilePath = `output_${videoId}.mp4`;
  const trimmedVideoPath = `input_temp_${videoId}.mp4`;

  try {
    //Generate the audio and the captions
    const result = await createTimestampedAudioFromText(text);
    const { audio, captions } = result;

    //Save the audio and captions to files
    fs.writeFileSync(audioFilePath, audio);
    generateSRT(captions, srtFilePath);

    //Trim the parkour video to the same duration as the audio
    const totalDuration = captions[captions.length - 1].end;
    await trimParkourVideo(totalDuration + 1, trimmedVideoPath);

    //Add the subtitles and audio to the video
    ffmpeg(trimmedVideoPath)
      .input(audioFilePath)
      .outputOptions([
        `-vf subtitles=${srtFilePath}:force_style='Alignment=2,MarginV=120'`,
        "-c:a aac",
        "-b:a 192k",
        "-shortest",
        "-map 0:v:0",
        "-map 1:a:0",
      ])
      .save(videoFilePath)
      .on("end", () => {
        console.log("Final video generated successfully");
        fs.unlinkSync(audioFilePath);
        fs.unlinkSync(`input_temp_${videoId}.mp4`);
        fs.unlinkSync(srtFilePath);
      })
      .on("error", (err) => {
        console.error("Error generating video", err.message);
      });
  } catch (error) {
    console.error("Error:", error.message);
  }
};
