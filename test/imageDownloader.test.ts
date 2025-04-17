import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import Stream from 'stream';
import { downloadImages } from '../src/infrastructure/imageDownloader';
import { ImageData } from '../src/domain/linkTransformer';

jest.mock('axios');

describe('downloadImages', () => {
  const imagesDir = '/tmp/images';
  const files: ImageData[] = [
    { original: 'https://ex.com/a.png', local: 'a.png' },
    { original: 'https://ex.com/b.jpg', local: 'b.jpg' }
  ];

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('downloads and writes images', async () => {
    // Mock axios.get to provide a PassThrough stream that finishes immediately
    (axios.get as jest.Mock).mockImplementation(() => {
      const readable = new Stream.PassThrough();
      process.nextTick(() => readable.end());
      return Promise.resolve({ data: readable });
    });

    // Mock fs.createWriteStream with a PassThrough and emit finish
    jest.spyOn(fs, 'createWriteStream').mockImplementation(() => {
      const writable = new Stream.PassThrough();
      process.nextTick(() => writable.emit('finish'));
      return writable as unknown as fs.WriteStream;
    });

    await downloadImages(files, imagesDir);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith('https://ex.com/a.png', { responseType: 'stream' });
    expect(axios.get).toHaveBeenCalledWith('https://ex.com/b.jpg', { responseType: 'stream' });

    expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(imagesDir, 'a.png'));
    expect(fs.createWriteStream).toHaveBeenCalledWith(path.join(imagesDir, 'b.jpg'));
  });
});