/**
 * @file audioExtractor.ts
 * @description Media processor for audioExtractor
 */

import { execSync } from "child_process";
export function extractAudio(videoPath: string, outputPath: string, options: { format?: string; bitrate?: string } = {}): void {
  const fmt = options.format ?? "mp3";
  const bitrate = options.bitrate ? `-b:a ${options.bitrate}` : "";
  execSync(`ffmpeg -i "${videoPath}" -vn -codec:a ${fmt === "mp3" ? "libmp3lame" : "copy"} ${bitrate} "${outputPath}"`, { stdio: "ignore" });
}
export default { extractAudio };
