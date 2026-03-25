/**
 * @file mp4Processor.ts
 * @description Media processor for mp4Processor
 */

import { execSync } from "child_process";
export interface VideoInfo { duration?: number; width?: number; height?: number; fps?: number; bitrate?: number; }
export function getVideoInfo(filePath: string): VideoInfo {
  try {
    const out = execSync(`ffprobe -v quiet -print_format json -show_streams "${filePath}"`, { encoding: "utf-8" });
    const data = JSON.parse(out) as { streams?: Array<{ codec_type: string; duration?: string; width?: number; height?: number; r_frame_rate?: string; bit_rate?: string }> };
    const stream = data.streams?.find((s) => s.codec_type === "video");
    const fps = stream?.r_frame_rate ? eval(stream.r_frame_rate) as number : undefined;
    return { duration: stream?.duration ? parseFloat(stream.duration) : undefined, width: stream?.width, height: stream?.height, fps, bitrate: stream?.bit_rate ? parseInt(stream.bit_rate) : undefined };
  } catch { return {}; }
}
export function convertMp4(inputPath: string, outputPath: string, options: { codec?: string; crf?: number } = {}): void {
  const codec = options.codec ?? "libx264";
  const crf = options.crf ?? 23;
  execSync(`ffmpeg -i "${inputPath}" -codec:v ${codec} -crf ${crf} "${outputPath}"`, { stdio: "ignore" });
}
export default { getVideoInfo, convertMp4 };
