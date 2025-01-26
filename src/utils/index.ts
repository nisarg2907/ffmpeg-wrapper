import ffmpeg, { type FfmpegCommand } from 'fluent-ffmpeg';

declare module 'fluent-ffmpeg' {
  interface FfmpegCommand {
    generateWaveform(options?: {
      resolution?: string;
      colors?: string;
      splitChannels?: boolean;
      scale?: 'lin' | 'log' | 'sqrt' | 'cbrt';
      draw?: 'scale' | 'full';
      filter?: 'average' | 'peak';
    }): FfmpegCommand;
  }
}

ffmpeg.prototype.generateWaveform = function(
  options: {
    resolution?: string;
    colors?: string;
    splitChannels?: boolean;
    scale?: 'lin' | 'log' | 'sqrt' | 'cbrt';
    draw?: 'scale' | 'full';
    filter?: 'average' | 'peak';
  } = {}
) {
  const {
    resolution = '600x240',
    colors = 'blue',
    splitChannels = false,
    scale = 'lin',
    draw = 'scale',
    filter = 'average'
  } = options;

  const filterOptions = [
    `size=${resolution}`,
    `split_channels=${splitChannels ? 1 : 0}`,
    `colors=${colors}`,
    `scale=${scale}`,
    `draw=${draw}`,
    `filter=${filter}`
  ].join(':');

  return this.videoFilters(`showwavespic=${filterOptions}`);
};

export default ffmpeg;