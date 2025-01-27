import ffmpeg from './utils';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { spawn } from 'child_process';

async function generateWaveform(inputPath: string, outputPath: string, resolution: string, colors: string) {
  return new Promise<void>((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });

    try {
      ffmpeg(inputPath)
        .generateWaveform({ resolution, colors })
        .output(outputPath)
        .outputOptions('-y')
        .on('end', () => resolve())
        .on('error', (err) => {
          if (err.message.includes('Invalid argument')) {
            const ffmpegArgs = [
              '-i', inputPath,
              '-y',
              '-filter_complex', `showwavespic=size=${resolution}:colors=${colors}`,
              outputPath
            ];

            const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { 
              stdio: ['ignore', 'pipe', 'pipe'] 
            });

            ffmpegProcess.on('close', (code) => {
              code === 0 ? resolve() : reject(new Error(`FFmpeg failed with code ${code}`));
            });

            ffmpegProcess.on('error', reject);
          } else {
            reject(err);
          }
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const inputAudio = await new Promise<string>((resolve) => {
    rl.question('Enter input audio path: ', resolve);
  });

  const outputImage = await new Promise<string>((resolve) => {
    rl.question('Enter output image path: ', resolve);
  });

  const resolution = await new Promise<string>((resolve) => {
    rl.question('Enter resolution (default: 1920x1080): ', (answer) => {
      resolve(answer || '1920x1080');
    });
  });

  const colors = await new Promise<string>((resolve) => {
    rl.question('Enter colors (default: blue): ', (answer) => {
      resolve(answer || 'blue');
      rl.close();
    });
  });

  try {
    await generateWaveform(
      path.resolve(inputAudio),
      path.resolve(outputImage),
      resolution,
      colors
    );
    console.log('Waveform generated successfully');
  } catch (error) {
    console.error('Error generating waveform:', error);
    process.exit(1);
  }
}

main();