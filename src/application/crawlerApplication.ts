import fs from 'fs-extra';
import path from 'path';
import { Browser } from 'puppeteer';
import { launchBrowser } from '../infrastructure/browserAdapter';
import { ensureDirExists, readVisited, writeVisited } from '../infrastructure/fileSystemAdapter';
import { scrollPage } from '../utils/scroll';
import { ImageData } from '../domain/linkTransformer';
import { downloadImages } from '../infrastructure/imageDownloader';

interface CrawlerOptions {
  startUrl: string;
  outputDir: string;
  reset: boolean;
  maxPages: number;
}

export class CrawlerApplication {
  private startUrl: string;
  private outputDir: string;
  private imagesDir: string;
  private visitedFilePath: string;
  private reset: boolean;
  private maxPages: number;
  private visited: Set<string> = new Set();

  constructor({ startUrl, outputDir, reset, maxPages }: CrawlerOptions) {
    this.startUrl = startUrl;
    this.outputDir = outputDir;
    this.imagesDir = path.join(outputDir, 'images');
    this.visitedFilePath = path.join(outputDir, 'visited.json');
    this.reset = reset;
    this.maxPages = maxPages;
  }

  public async run(): Promise<void> {
    await ensureDirExists(this.outputDir);
    await ensureDirExists(this.imagesDir);
    await this.loadVisited();

    const browser: Browser = await launchBrowser({ headless: false });
    const queue: string[] = [this.startUrl];
    let pageCount = 0;

    while (queue.length > 0 && pageCount < this.maxPages) {
      const url = queue.shift() as string;
      if (this.visited.has(url)) continue;
      this.visited.add(url);
      console.log(`Crawling: ${url}`);

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await scrollPage(page);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const links: string[] = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a'))
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => href.includes('notion.site'));
        });
        for (const link of links) {
          if (!this.visited.has(link)) queue.push(link);
        }
        pageCount++;

        // Inyectamos aquí las funciones de transformación dentro del contexto de la página
        const imagesData: ImageData[] = await page.evaluate(() => {
          function transformAnchors(doc: Document) {
            Array.from(doc.querySelectorAll('a')).forEach((a: Element) => {
              const anchor = a as HTMLAnchorElement;
              if (anchor.href.includes('notion.site')) {
                const urlObj = new URL(anchor.href);
                const fileName = urlObj.pathname.replace(/^\//, '').replace(/\//g, '_') + '.html';
                anchor.href = `./${fileName}`;
              }
            });
          }
          function transformImages(doc: Document) {
            const result: ImageData[] = [];
            Array.from(doc.querySelectorAll('img')).forEach((i: Element) => {
              const img = i as HTMLImageElement;
              const src = img.getAttribute('src');
              if (!src) return;
              let urlObj: URL;
              try { urlObj = new URL(src); } 
              catch { urlObj = new URL(src, window.location.origin); }
              let name = urlObj.pathname.split('/').pop() || 'image';
              name = name.split('?')[0].replace(/[^a-z0-9_\-\.]/gi, '_');
              img.src = `./images/${name}`;
              result.push({ original: urlObj.toString(), local: name });
            });
            return result;
          }
          transformAnchors(document);
          return transformImages(document);
        });
        await downloadImages(imagesData, this.imagesDir);

        const html = await page.content();
        const pathname = new URL(url).pathname.replace(/^\//, '').replace(/\//g, '_') || 'index';
        const filePath = path.join(this.outputDir, `${pathname}.html`);
        if (!await fs.pathExists(filePath)) {
          await fs.writeFile(filePath, html);
          console.log(`Saved: ${filePath}`);
        } else {
          console.log(`File exists: ${filePath}, skipping.`);
        }

        await writeVisited(this.visitedFilePath, Array.from(this.visited));
      } catch (err) {
        console.error(`Error crawling ${url}:`, err);
      } finally {
        await page.close();
      }
    }

    await browser.close();
    console.log(`Pages crawled: ${pageCount}`);
  }

  private async loadVisited(): Promise<void> {
    if (await fs.pathExists(this.visitedFilePath) && !this.reset) {
      const arr = await readVisited(this.visitedFilePath);
      this.visited = new Set(arr);
    } else if (this.reset) {
      await fs.remove(this.visitedFilePath);
    }
  }
}