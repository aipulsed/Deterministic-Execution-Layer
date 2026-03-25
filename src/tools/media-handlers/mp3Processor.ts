/**
 * @file mp3Processor.ts
 * @description Media processor for mp3Processor
 */

import { execSync } from "child_process";
export interface AudioInfo { duration?: number; bitrate?: number; sampleRate?: number; channels?: number; }
export function getAudioInfo(filePath: string): AudioInfo {
  try {
    const out = execSync(`ffprobe -v quiet -print_format json -show_streams "${filePath}"`, { encoding: "utf-8" });
    const data = JSON.parse(out) as { streams?: Array<{ codec_type: string; duration?: string; bit_rate?: string; sample_rate?: string; channels?: number }> };
    const stream = data.streams?.find((s) => s.codec_type === "audio");
    return { duration: stream?.duration ? parseFloat(stream.duration) : undefined, bitrate: stream?.bit_rate ? parseInt(stream.bit_rate) : undefined, sampleRate: stream?.sample_rate ? parseInt(stream.sample_rate) : undefined, channels: stream?.channels };
  } catch { return {}; }
}
export function convertMp3(inputPath: string, outputPath: string, bitrate = "128k"): void {
  execSync(`ffmpeg -i "${inputPath}" -codec:a libmp3lame -b:a ${bitrate} "${outputPath}"`, { stdio: "ignore" });
}
export default { getAudioInfo, convertMp3 };
