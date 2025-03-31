const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

(async () => {
  // URL inicial de la página Notion
  const startUrl = 'https://fine-road-79e.notion.site/EDN-18674ab5917980fdb259f57052a65a0d';
  const folder = URL.parse(startUrl).hostname;

  // Carpeta base donde se guardarán las páginas
  const outputDir = path.join(__dirname, 'sites', folder);
  await fs.ensureDir(outputDir);

  // Carpeta para guardar las imágenes
  const imagesDir = path.join(outputDir, 'images');
  await fs.ensureDir(imagesDir);

  // Archivo para persistir los URLs ya visitados
  const visitedFilePath = path.join(outputDir, 'visited.json');
  let visited = new Set();
  if (await fs.pathExists(visitedFilePath)) {
    const visitedArray = await fs.readJSON(visitedFilePath);
    visited = new Set(visitedArray);
  }

  const browser = await puppeteer.launch({ headless: false });
  const queue = [startUrl];
  const maxPages = 10000; // Límite para evitar crawls infinitos
  let pageCount = 0;

  while (queue.length > 0 && pageCount < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    console.log(`Crawling: ${currentUrl}`);

    // Generar el nombre del archivo basado en la URL (puedes ajustarlo si lo deseas)
    const fileName = URL.parse(currentUrl).pathname.replace('/', '') + '.html';
    const filePath = path.join(outputDir, fileName);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    try {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Hacer scroll para cargar contenido dinámico
      await autoScroll(page);
      // Espera adicional para que se complete la carga
      await new Promise(resolve => setTimeout(resolve, 2000));

            // Extraer enlaces internos (aquellos que contienen "notion.site")
            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return anchors
                  .map(a => a.href)
                  .filter(href => href && href.includes('notion.site'));
              });
              
              // Agregar enlaces nuevos a la cola
              for (const link of links) {
                if (!visited.has(link)) {
                  queue.push(link);
                }
              }
              pageCount++;

      // Modificar enlaces de páginas y extraer datos de imágenes
      const imagesData = await page.evaluate(() => {
        // Actualizar enlaces de <a>
        const anchors = Array.from(document.querySelectorAll('a'));
        anchors.forEach(a => {
          if (a.href && a.href.includes('notion.site')) {
            try {
              const urlObj = new URL(a.href);
              let fileName = urlObj.pathname;
              if (fileName.startsWith('/')) fileName = fileName.slice(1);
              fileName = fileName.replace(/\//g, '_') + '.html';
              a.href = './' + fileName;
            } catch (err) {
              console.error(err);
            }
          }
        });
        
        // Actualizar <img> y extraer información para descarga
        const imageElements = Array.from(document.querySelectorAll('img'));
        const images = [];
        imageElements.forEach(img => {
          const src = img.getAttribute('src');
          if (src) {
            try {
              // Convertir a URL absoluta
              let urlObj;
              try {
                urlObj = new URL(src);
              } catch (e) {
                urlObj = new URL(src, window.location.origin);
              }
              // Obtener nombre del archivo a partir de la última parte del pathname
              let imageFileName = urlObj.pathname.split('/').pop() || 'image';
              // Quitar parámetros de consulta
              imageFileName = imageFileName.split('?')[0];
              // Sanitizar el nombre
              imageFileName = imageFileName.replace(/[^a-z0-9_\-\.]/gi, '_');
              // Definir la nueva ruta local para la imagen
              const localPath = './images/' + imageFileName;
              img.src = localPath;
              images.push({
                original: urlObj.toString(),
                local: imageFileName
              });
            } catch (err) {
              console.error(err);
            }
          }
        });
        return images;
      });
      
      // Descargar cada imagen extraída
      for (const img of imagesData) {
        const imageUrl = img.original;
        const localImagePath = path.join(imagesDir, img.local);
        try {
          const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'stream'
          });
          const writer = fs.createWriteStream(localImagePath);
          response.data.pipe(writer);
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          console.log(`Downloaded image: ${localImagePath}`);
        } catch (err) {
          console.error(`Error downloading image ${imageUrl}: ${err}`);
        }
      }

      // Capturar el HTML modificado (con enlaces actualizados)
      const html = await page.content();
      
      // Guardar la página solo si no existe el archivo
      if (await fs.pathExists(filePath)) {
        console.log(`El archivo ya existe: ${filePath}. Se omite...`);
      } else {
        await fs.writeFile(filePath, html);
        console.log(`Saved: ${filePath}`);
      }
      

      
      // Actualizar el archivo de URLs visitados
      await fs.writeJSON(visitedFilePath, Array.from(visited));
    } catch (err) {
      console.error(`Error crawling ${currentUrl}: ${err}`);
    } finally {
      await page.close();
    }
  }

  console.log(`Crawling finished. Pages crawled: ${pageCount}`);
  await browser.close();
})();

// Función para hacer scroll de forma automática
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
