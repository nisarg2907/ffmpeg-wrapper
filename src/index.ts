import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import readline from 'readline';

function validatePath(filePath: string, mode: 'read' | 'write') {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(dir)) {
      throw new Error(`Directory does not exist: ${dir}`);
    }

    if (mode === 'write') {
      const tempFile = path.join(dir, `temp-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, 'test');
      fs.unlinkSync(tempFile);
    }

    return true;
  } catch (err) {
    console.error(`[PATH ERROR] Validation failed for ${filePath}:`, err);
    throw err;
  }
}

function generateWaveform(inputPath: string, outputPath: string, resolution: string, colors: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      validatePath(inputPath, 'read');
      validatePath(outputPath, 'write');
    } catch (pathErr) {
      return reject(pathErr);
    }

    const ffmpegArgs = [
      '-i', inputPath,
      '-y',
      '-filter_complex', `showwavespic=size=${resolution}:colors=${colors}`,
      outputPath
    ];

    console.log('[FFMPEG] Command:', 'ffmpeg', ffmpegArgs.join(' '));

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log('[WAVEFORM] Generation completed successfully');
        resolve();
      } else {
        const error = new Error(`FFmpeg failed with code ${code}`);
        console.error('[FFMPEG ERROR]:', error);
        reject(error);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('[PROCESS ERROR]:', err);
      reject(err);
    });
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let inputAudio = '';
  let outputImage = '';
  let resolution = '1920x1080';
  let colors = 'blue';

  await new Promise<void>((resolve) => {
    rl.question('Enter input audio path: ', (answer) => {
      inputAudio = answer;
      rl.question('Enter output image path: ', (answer) => {
        outputImage = answer;
        rl.question('Enter resolution (default: 1920x1080): ', (answer) => {
          if (answer) resolution = answer;
          rl.question('Enter colors (default: blue): ', (answer) => {
            if (answer) colors = answer;
            rl.close();
            resolve();
          });
        });
      });
    });
  });

  if (!inputAudio || !outputImage) {
    console.error('Usage: node script.js <input_audio> <output_image> [resolution] [colors]');
    process.exit(1);
  }

  try {
    await generateWaveform(
      path.resolve(inputAudio), 
      path.resolve(outputImage), 
      resolution, 
      colors
    );

    console.log(`[SUCCESS] Waveform generated at: ${outputImage}`);
  } catch (error) {
    console.error('[FATAL ERROR]:', error);
    process.exit(1);
  }
}

main();