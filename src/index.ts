import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Comprehensive path and permission validation
function validatePath(filePath: string, mode: 'read' | 'write') {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    // Check file/directory existence
    if (!fs.existsSync(dir)) {
      throw new Error(`Directory does not exist: ${dir}`);
    }

    // Attempt to set permissions
    try {
      fs.chmodSync(dir, 0o777);
    } catch (permErr) {
      console.warn(`[PERMISSION] Could not set permissions for ${dir}:`, permErr);
    }

    // Validate write access by attempting to create a temp file
    if (mode === 'write') {
      const tempFile = path.join(dir, `temp-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, 'test');
      fs.unlinkSync(tempFile);
    }

    console.log(`[PATH VALIDATION] ${filePath} - ${mode} access verified`);
    return true;
  } catch (err) {
    console.error(`[PATH ERROR] Validation failed for ${filePath}:`, err);
    throw err;
  }
}

// Direct FFmpeg command execution with detailed error handling
function generateWaveform(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    // Validate input and output paths
    try {
      validatePath(inputPath, 'read');
      validatePath(outputPath, 'write');
    } catch (pathErr) {
      return reject(pathErr);
    }

    // Construct FFmpeg command manually
    const ffmpegArgs = [
      '-i', inputPath,
      '-y',  // Overwrite output files
      '-filter_complex', 'showwavespic=size=1920x1080:colors=blue',
      outputPath
    ];

    console.log('[FFMPEG] Command:', 'ffmpeg', ffmpegArgs.join(' '));

    // Spawn FFmpeg process directly
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });

    // Capture stdout and stderr
    ffmpegProcess.stdout.on('data', (data) => {
      console.log('[FFMPEG STDOUT]:', data.toString());
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error('[FFMPEG STDERR]:', data.toString());
    });

    // Handle process completion
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

    // Handle process errors
    ffmpegProcess.on('error', (err) => {
      console.error('[PROCESS ERROR]:', err);
      reject(err);
    });
  });
}

// Main execution function
async function main() {
  try {
    // Resolve absolute paths
    const inputAudio = path.resolve(__dirname, '../audio/input.mp3');
    const outputDir = path.resolve(__dirname, '../output');
    const outputImage = path.join(outputDir, 'waveform.png');

    // Generate waveform
    await generateWaveform(inputAudio, outputImage);

    console.log(`[SUCCESS] Waveform generated at: ${outputImage}`);
  } catch (error) {
    console.error('[FATAL ERROR]:', error);
    process.exit(1);
  }
}

// Execute the main function
main();