import { RetrievedChunk } from '../types.js';
import { VectorStore } from './vector-store.js';
import config from '../config.js';
import { generateEmbedding } from './embeddings.js';

let vectorStoreInstance: VectorStore | null = null;

export function getStore(): VectorStore {
  if (!vectorStoreInstance) {
    vectorStoreInstance = new VectorStore(config.dbPath);
  }
  return vectorStoreInstance;
}

export async function retriveContext(
  query: string,
  topK: number = config.ragTopK,
): Promise<RetrievedChunk[]> {
  const store = getStore();
  if ((await store.getSize()) === 0) {
    console.log(
      'Vector store vacío - usa / ingest para cargar la documentación',
    );
    return [];
  }
  const queryVector = await generateEmbedding(query);
  const topSearchResults = store.search(queryVector, topK);
  const chunks: RetrievedChunk[] = (await topSearchResults).map((result) => ({
    ...result.chunk,
    score: result.score,
  }));
  const preview = query.length > 50 ? query.slice(0, 50) + '...' : query;

  console.log(`Buscando: "${preview}" -> ${chunks.length} chunks recuperados`);
  return chunks;
}

export function resetStore(): void {
  if (vectorStoreInstance) {
    vectorStoreInstance.close();
    vectorStoreInstance = null;
  }
}
