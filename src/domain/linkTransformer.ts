export interface ImageData {
    original: string;
    local: string;
  }
  
  export function transformAnchors(doc: Document): void {
    const anchors = Array.from(doc.querySelectorAll('a')) as HTMLAnchorElement[];
    anchors.forEach(a => {
      if (a.href.includes('notion.site')) {
        const urlObj = new URL(a.href);
        const fileName = urlObj.pathname.replace(/^\//, '').replace(/\//g, '_') + '.html';
        a.href = `./${fileName}`;
      }
    });
  }
  
  export function transformImages(doc: Document): ImageData[] {
    const imgs = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
    const result: ImageData[] = [];
    imgs.forEach(img => {
      const src = img.getAttribute('src');
      if (!src) return;
      let urlObj: URL;
      try {
        urlObj = new URL(src);
      } catch {
        urlObj = new URL(src, window.location.origin);
      }
      let name = urlObj.pathname.split('/').pop() || 'image';
      name = name.split('?')[0].replace(/[^a-z0-9_\-\.]/gi, '_');
      img.src = `./images/${name}`;
      result.push({ original: urlObj.toString(), local: name });
    });
    return result;
  }