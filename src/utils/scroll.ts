import { Page } from 'puppeteer';

export async function scrollPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>(resolve => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        totalHeight += distance;
        window.scrollBy(0, distance);
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}