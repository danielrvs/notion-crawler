import puppeteer, { Browser, LaunchOptions } from 'puppeteer';

export async function launchBrowser(options: LaunchOptions = {}): Promise<Browser> {
  return puppeteer.launch(options);
}