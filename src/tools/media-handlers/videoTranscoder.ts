/**
 * @file videoTranscoder.ts
 * @description Media processor for videoTranscoder
 */

import { execSync } from "child_process";
export interface TranscodeOptions { resolution?: string; videoBitrate?: string; audioBitrate?: string; codec?: string; }
export function transcodeVideo(inputPath: string, outputPath: string, options: TranscodeOptions = {}): void {
  const res = options.resolution ? `-vf scale=${options.resolution}` : "";
  const vb = options.videoBitrate ? `-b:v ${options.videoBitrate}` : "";
  const ab = options.audioBitrate ? `-b:a ${options.audioBitrate}` : "";
  const codec = options.codec ? `-codec:v ${options.codec}` : "";
  execSync(`ffmpeg -i "${inputPath}" ${codec} ${res} ${vb} ${ab} "${outputPath}"`, { stdio: "ignore" });
}
export default { transcodeVideo };
