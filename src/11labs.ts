import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type WordGroup = {
  text: string;
  start: number;
  end: number;
};

//Group the characters captions from elevenlabs
function groupByWords(data: Alignment): WordGroup[] {
  const {
    characters,
    character_start_times_seconds,
    character_end_times_seconds,
  } = data;
  const words: WordGroup[] = [];
  let currentWord = "";
  let currentStart: number | null = null;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];

    if (char === " ") {
      if (currentWord) {
        words.push({
          text: currentWord,
          start: currentStart!,
          end: character_end_times_seconds[i - 1],
        });
        currentWord = "";
        currentStart = null;
      }
    } else {
      if (!currentWord) {
        currentStart = character_start_times_seconds[i];
      }
      currentWord += char;
    }
  }

  if (currentWord) {
    words.push({
      text: currentWord,
      start: currentStart!,
      end: character_end_times_seconds[characters.length - 1],
    });
  }

  return words;
}

export const createTimestampedAudioFromText = async (text: string) => {
  const audioStream = await client.textToSpeech.convertWithTimestamps(
    "pNInz6obpgDQGcFmaJgB",
    {
      model_id: "eleven_turbo_v2_5",
      text,
    }
  );

  const typedAudioStream = audioStream as {
    audio_base64: string;
    alignment: Alignment;
  };

  //The audio as a buffer
  const audioBuffer = Buffer.from(typedAudioStream.audio_base64, "base64");

  //The captions grouped by words
  const captionsByWords = groupByWords(typedAudioStream.alignment);

  return { audio: audioBuffer, captions: captionsByWords };
};
