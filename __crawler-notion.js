import notionCrawler from "./notion-crawler.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Definir __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const rootNotionPageId = "18674ab5917980fdb259f57052a65a0d"; // Reemplaza con tu ID de página
  const outputDir = path.join(__dirname, "notion_pages");

  // Crear el directorio de salida si no existe
  await fs.ensureDir(outputDir);

  // Obtener los datos de la página usando la función 'crawl'
  const { pageBlocks, notionPageIdToSlugMapper, pageMap } = await notionCrawler(rootNotionPageId);

  // Función para convertir los bloques de Notion a HTML simple
  const blocksToHtml = (blocks) => {
    return blocks.map(block => {
      const title = block.properties?.title || "";
      switch (block.type) {
        case "text":
          return `<p>${title}</p>`;
        case "header":
          return `<h1>${title}</h1>`;
        case "sub_header":
          return `<h2>${title}</h2>`;
        case "sub_sub_header":
          return `<h3>${title}</h3>`;
        case "bulleted_list":
          return `<ul><li>${title}</li></ul>`;
        case "numbered_list":
          return `<ol><li>${title}</li></ol>`;
        case "image":
          return `<img src="${block.properties?.source || ""}" alt="Imagen de Notion">`;
        default:
          return `<!-- Bloque de tipo ${block.type} no soportado -->`;
      }
    }).join("\n");
  };

  // Guardar la página raíz
  const rootPageHtml = blocksToHtml(pageBlocks);
  const rootPagePath = path.join(outputDir, "index.html");
  await fs.writeFile(rootPagePath, rootPageHtml);
  console.log(`Página raíz guardada en ${rootPagePath}`);

  // Guardar las subpáginas
  for (const [pageId, page] of Object.entries(pageMap)) {
    const subPageHtml = blocksToHtml(page.blocks);
    const subPageSlug = notionPageIdToSlugMapper[pageId] || pageId;
    const subPagePath = path.join(outputDir, `${subPageSlug}.html`);
    await fs.writeFile(subPagePath, subPageHtml);
    console.log(`Subpágina guardada en ${subPagePath}`);
  }

  console.log("Todas las páginas han sido guardadas exitosamente.");
})();