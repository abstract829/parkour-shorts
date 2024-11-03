import fs from "fs";

function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss},${ms}`;
}

//Generates a SRT file from the captions, then we can use this file to add subtitles to a video with ffmpeg
export function generateSRT(captions, outputFile) {
  const srtContent = captions
    .map((caption, index) => {
      return `${index + 1}\n${formatTime(caption.start)} --> ${formatTime(
        caption.end
      )}\n${caption.text}\n`;
    })
    .join("\n");

  fs.writeFileSync(outputFile, srtContent, "utf-8");
}
