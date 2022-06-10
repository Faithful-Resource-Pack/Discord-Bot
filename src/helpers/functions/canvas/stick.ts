import { Canvas, createCanvas } from 'canvas';
import { MessageAttachment } from 'discord.js';
import { magnifyCanvas } from './magnify';

interface Options {
  leftURL: string;
  rightURL: string;
  name?: string;
}

export async function stickCanvas(options: Options): Promise<Canvas> {
  return Promise.all([
    magnifyCanvas({ url: options.leftURL, factor: 32 }),
    magnifyCanvas({ url: options.rightURL, factor: 32 }),
  ])
    .then(([leftCanvas, rightCanvas]) => {
      const margin = 10; // in pixels
      const canvas = createCanvas(leftCanvas.width * 2 + margin, leftCanvas.height);
      const context = canvas.getContext('2d');

      console.log(leftCanvas, rightCanvas);

      context.imageSmoothingEnabled = false;
      context.drawImage(leftCanvas, 0, 0);
      context.drawImage(rightCanvas, leftCanvas.width + margin, 0);

      return canvas;
    });
}

export async function stickAttachment(options: Options): Promise<MessageAttachment> {
  try {
    const canvas = await stickCanvas(options);
    return new MessageAttachment(canvas.toBuffer('image/png'), `${options.name ? options.name : 'sticked.png'}`);
  } catch {
    return null;
  }
}
