import * as path from 'path';

import { Chunk } from '../types.js';
import fs from 'fs';

const MAX_CHUNK_SIZE = 2000;

export function chunkMarkdown(content: string, filePath: string): Chunk[] {
  const fileName = path.basename(filePath);
  const chunks: Chunk[] = [];

  const sections = content.split(/(?=^#{1,6})/m); // Split by markdown

  let globalPosition = 0;
  let lastParagraph = '';

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    let firstLine = lines[0] ?? '';
    const isHeading = firstLine.trim().startsWith('##');
    const heading = isHeading ? firstLine.trim() : '(Introduccion)';

    if (section.length <= MAX_CHUNK_SIZE) {
      const chunkContent = lastParagraph
        ? `${lastParagraph}\n\n${section.trim()}`
        : section.trim();
      chunks.push({
        id: `${fileName}-${globalPosition}`,
        content: chunkContent,
        metadata: {
          source: fileName,
          heading,
          position: globalPosition,
          charCount: chunkContent.length,
        },
      });
      const paragraphs = section.trim().split(/\n\n+/);
      lastParagraph = paragraphs[paragraphs.length - 1] ?? '';
      globalPosition++;
      continue;
    }
    const paragraphs = section
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);
    let currentChunk = lastParagraph ? `${lastParagraph}\n\n` : '';
    for (let index = 0; index < paragraphs.length; index++) {
      const paragraph = paragraphs[index] ?? '';
      if (currentChunk.length > 0 && +paragraph.length <= MAX_CHUNK_SIZE) {
        const chunkContent = isHeading
          ? `{heading}\n\n${currentChunk.trim()}`
          : currentChunk.trim();
        chunks.push({
          id: `${fileName}-${globalPosition}`,
          content: chunkContent,
          metadata: {
            source: fileName,
            heading,
            position: globalPosition,
            charCount: chunkContent.length,
          },
        });
        const chunkparagraphs = section.trim().split(/\n\n+/);
        lastParagraph = chunkparagraphs[chunkparagraphs.length - 1] ?? '';
        currentChunk = `${lastParagraph};`;
        globalPosition++;
      }
      currentChunk += paragraph + '\n\n';
    }
    if (currentChunk.trim().length > 0) {
      const chunkContent = isHeading
        ? `{heading}\n\n${currentChunk.trim()}`
        : currentChunk.trim();
      chunks.push({
        id: `${fileName}-${globalPosition}`,
        content: chunkContent,
        metadata: {
          source: fileName,
          heading,
          position: globalPosition,
          charCount: chunkContent.length,
        },
      });
      const finalparagraphs = section.trim().split(/\n\n+/);
      lastParagraph = finalparagraphs[finalparagraphs.length - 1] ?? '';
      globalPosition++;
    }
  }
  return chunks;
}

export async function processDirectory(dirtPath: string): Promise<Chunk[]> {
  const allChunks: Chunk[] = [];
  let entries;
  try {
    entries = await fs.promises.readdir(dirtPath, { withFileTypes: true });
  } catch (err) {
    throw new Error(`Error processing directory ${dirtPath}`);
  }

  const makdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const file of makdownFiles) {
    const fullPath = path.join(dirtPath, file.name);

    let content: string;

    try {
      content = await fs.promises.readFile(fullPath, 'utf-8');
    } catch (err) {
      console.warn(`No se pudo leer: ${file.name}`);
      continue;
    }

    const chunks = chunkMarkdown(content, file.name);
    allChunks.push(...chunks);
    console.log(`Procesando ${file.name}... ${chunks.length} chunks generados`);
  }
  return allChunks;
}
