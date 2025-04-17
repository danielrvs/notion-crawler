import { JSDOM } from 'jsdom';
import { transformAnchors, transformImages, ImageData } from '../src/domain/linkTransformer';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for jsdom
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

describe('linkTransformer', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(
      `<!DOCTYPE html>
       <a id="n1" href="https://notion.site/page/123">Notion</a>
       <a id="e1" href="https://example.com">External</a>
       <img id="i1" src="/media/img.png?size=large">`,
      { url: 'https://notion.site/' }
    );

    // expose window globally so linkTransformer relies on the right origin
    (global as any).window = dom.window as any;
  });

  it('rewrites internal Notion anchors', () => {
    const doc = dom.window.document;
    transformAnchors(doc);

    const internalHref = (doc.getElementById('n1') as HTMLAnchorElement).href;
    const externalHref = (doc.getElementById('e1') as HTMLAnchorElement).href;

    expect(internalHref).toBe('https://notion.site/page_123.html');
    expect(externalHref).toBe('https://example.com/');
  });

  it('rewrites image src and returns correct metadata regardless of origin', () => {
    const doc = dom.window.document;
    const images: ImageData[] = transformImages(doc);

    const imgSrc = (doc.getElementById('i1') as HTMLImageElement).getAttribute('src');
    expect(imgSrc).toBe('./images/img.png');

    // ImageData should have the sanitized local name and any absolute origin
    expect(images[0].local).toBe('img.png');
    expect(images[0].original).toMatch(/\/media\/img\.png\?size=large$/);
  });
});