/**
 * @file wavProcessor.ts
 * @description Media processor for wavProcessor
 */

import { execSync } from "child_process";
export function convertWav(inputPath: string, outputPath: string, options: { sampleRate?: number; channels?: number } = {}): void {
  const sr = options.sampleRate ? `-ar ${options.sampleRate}` : "";
  const ch = options.channels ? `-ac ${options.channels}` : "";
  execSync(`ffmpeg -i "${inputPath}" ${sr} ${ch} "${outputPath}"`, { stdio: "ignore" });
}
export function wavToMp3(inputPath: string, outputPath: string): void {
  execSync(`ffmpeg -i "${inputPath}" -codec:a libmp3lame "${outputPath}"`, { stdio: "ignore" });
}
export default { convertWav, wavToMp3 };
