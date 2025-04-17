import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { ImageData } from '../domain/linkTransformer';

export async function downloadImages(imagesData: ImageData[], imagesDir: string): Promise<void> {
  for (const img of imagesData) {
    const imageUrl = img.original;
    const localPath = path.join(imagesDir, img.local);
    try {
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });
      console.log(`Downloaded image: ${localPath}`);
    } catch (err) {
      console.error(`Error downloading image ${imageUrl}:`, err);
    }
  }
}