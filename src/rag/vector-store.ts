// import * as fs from 'fs';
// import * as path from 'path';
// import * as sqliteVec from 'sqlite-vec';

// import type { Chunk, SearchResult } from '../types.js';

// import Database from 'better-sqlite3';

// interface ChunkRow {
//   id: string;
//   content: string;
//   source: string;
//   heading?: string;
//   position: number;
//   char_count: number;
//   embedding: number[];
// }

// interface SearchRow extends ChunkRow {
//   distance: number;
// }

// function serializeEmbedding(embedding: number[]): Buffer {
//   const float32 = new Float32Array(embedding);
//   return Buffer.from(float32.buffer);
// }

// export class VectorStore {
//   private db: Database.Database;
//   constructor(dbPath: string) {
//     const dir = path.dirname(dbPath);
//     if (!fs.existsSync(dir)) {
//       (fs.mkdirSync(dir), { recursive: true });
//     }
//     this.db = new Database(dbPath);
//     sqliteVec.load(this.db);

//     this.db.pragma('journal_mode = WAL');
//     this.db.pragma('synchronous = NORMAL');

//     this.createTables();
//   }

//   private createTables(): void {
//     this.db.exec(
//       `Create table if not existss chunks(
//       id TEXT PRIMARY KEY,
//       content TEXT NOT NULL,
//       source TEXT NOT NULL,
//       heading TEXT NOT NULL,
//       position INTEGER NOT NULL,
//       char_count INTEGER NOT NULL

//       )`,
//     );

//     this.db.exec(
//       `CREATE VIRTUAL TABLE IF NOT EXISTS chunks_embeddings USING VEC0(
//       chunk_id id TEXT PARTITION KEY,
//       embedding float[1536],

//       )`,
//     );
//   }

//   insert(chunk: Chunk, embedding: number[]): void {
//     const insertChunk = this.db.prepare(`
//       INSERT OR REPLACE INTO chunks(id,content,source,heading,position,char_count) Values(?,?,?,?,?,?)`);
//     insertChunk.run(
//       chunk.id,
//       chunk.content,
//       chunk.metadata.source,
//       chunk.metadata.heading ?? '',
//       chunk.metadata.position,
//       chunk.metadata.charCount,
//     );

//     const insertEmbedding = this.db.prepare(`
//       INSERT OR REPLACE INTO chunks_embeddings(chunk_id,embedding) VALUES(?,?)
//     `);
//     insertEmbedding.run(chunk.id, serializeEmbedding(embedding));
//   }
//   search(queryEmbedding: number[], topk: number): SearchResult[] {
//     const stmt = this.db.prepare(`

//       SELECT c.id, c.source, c.heading, c.position, c.char_count, e.distance FROM chunk_embeddings e JOIN chunks c ON c.id = e.chunk_id WHERE e.embedding MATCH ? AND k = ? ORDER BY e.distance
//       `);
//     const rows = stmt.all(
//       serializeEmbedding(queryEmbedding),
//       topk,
//     ) as SearchRow[];
//     return rows.map((row) => ({
//       chunk: {
//         id: row.id,
//         content: row.content,
//         metadata: {
//           source: row.source,
//           heading: row.heading,
//           position: row.position,
//           charCount: row.char_count,
//         },
//       },
//       score: 1 - row.distance / 2,
//     }));
//   }
//   clear(): void {
//     this.db.exec('DELETE FROM chunk_embeddings');
//     this.db.exec('DELETE FROM chunk');
//   }
//   get size(): number {
//     const row = this.db
//       .prepare(`SELECT COUNT(*) as count FROM chunks`)
//       .get() as { count: number };
//     return row.count;
//   }
//   close(): void {
//     this.db.close();
//   }
// }

import * as fs from 'fs';
import * as path from 'path';
import * as sqliteVec from 'sqlite-vec';

import type { Chunk, SearchResult } from '../types.js';

import sqlite3 from 'sqlite3';

interface ChunkRow {
  id: string;
  content: string;
  source: string;
  heading?: string;
  position: number;
  char_count: number;
}

interface SearchRow extends ChunkRow {
  distance: number;
}

function serializeEmbedding(embedding: number[]): Buffer {
  const float32 = new Float32Array(embedding);
  return Buffer.from(float32.buffer);
}

export class VectorStore {
  private db: sqlite3.Database;
  private isReady: Promise<void>; // <-- Agregar esto

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath);

    // Cargar sqlite-vec forzando el tipo para evitar el error TS2345
    sqliteVec.load(this.db as unknown as Parameters<typeof sqliteVec.load>[0]);

    //this.createTables();
    // Guardar la promesa de inicialización
    this.isReady = this.createTables();
  }

  private runQuery(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // private createTables(): void {
  //   this.db.serialize(() => {
  //     this.db.run('PRAGMA journal_mode = WAL;');
  //     this.db.run('PRAGMA synchronous = NORMAL;');

  //     this.db.run(`
  //       CREATE TABLE IF NOT EXISTS chunks (
  //         id TEXT PRIMARY KEY,
  //         content TEXT NOT NULL,
  //         source TEXT NOT NULL,
  //         heading TEXT,
  //         position INTEGER NOT NULL,
  //         char_count INTEGER NOT NULL
  //       )
  //     `);

  //     this.db.run(`
  //       CREATE VIRTUAL TABLE IF NOT EXISTS chunk_embeddings USING vec0(
  //         chunk_id TEXT PRIMARY KEY,
  //         embedding float[1536]
  //       )
  //     `);
  //   });
  // }

  //TODO NUevo
  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('PRAGMA journal_mode = WAL;');
        this.db.run('PRAGMA synchronous = NORMAL;');
        this.db.run(`
        CREATE TABLE IF NOT EXISTS chunks (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          source TEXT NOT NULL,
          heading TEXT,
          position INTEGER NOT NULL,
          char_count INTEGER NOT NULL
        )
      `);
        this.db.run(
          `
        CREATE VIRTUAL TABLE IF NOT EXISTS chunk_embeddings USING vec0(
          chunk_id TEXT PRIMARY KEY,
          embedding float[1536]
        )
      `,
          (err) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });
    });
  }

  async insert(chunk: Chunk, embedding: number[]): Promise<void> {
    await this.isReady; // <-- Esperar

    const insertChunkSql = `
      INSERT OR REPLACE INTO chunks(id, content, source, heading, position, char_count) 
      VALUES(?, ?, ?, ?, ?, ?)
    `;

    await this.runQuery(insertChunkSql, [
      chunk.id,
      chunk.content,
      chunk.metadata.source,
      chunk.metadata.heading ?? '',
      chunk.metadata.position,
      chunk.metadata.charCount,
    ]);

    const insertEmbeddingSql = `
      INSERT OR REPLACE INTO chunk_embeddings(chunk_id, embedding) 
      VALUES(?, ?)
    `;

    await this.runQuery(insertEmbeddingSql, [
      chunk.id,
      serializeEmbedding(embedding),
    ]);
  }

  async search(
    queryEmbedding: number[],
    topk: number,
  ): Promise<SearchResult[]> {
    await this.isReady; // <-- Esperar
    const sql = `
      SELECT 
        c.id, 
        c.content, 
        c.source, 
        c.heading, 
        c.position, 
        c.char_count, 
        e.distance 
      FROM chunk_embeddings e 
      JOIN chunks c ON c.id = e.chunk_id 
      WHERE e.embedding MATCH ? AND k = ? 
      ORDER BY e.distance
    `;

    return new Promise((resolve, reject) => {
      this.db.all(
        sql,
        [serializeEmbedding(queryEmbedding), topk],
        (err, rows: SearchRow[]) => {
          if (err) {
            reject(err);
            return;
          }

          const results = rows.map((row) => ({
            chunk: {
              id: row.id,
              content: row.content,
              metadata: {
                source: row.source,
                heading: row.heading,
                position: row.position,
                charCount: row.char_count,
              },
            },
            score: 1 - row.distance / 2,
          }));

          resolve(results);
        },
      );
    });
  }

  async clear(): Promise<void> {
    await this.isReady; // <-- Esperar
    await this.runQuery('DELETE FROM chunk_embeddings');
    await this.runQuery('DELETE FROM chunks');
  }

  async getSize(): Promise<number> {
    await this.isReady; // <-- Esperar
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) as count FROM chunks`,
        (err, row: { count: number }) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        },
      );
    });
  }

  close(): void {
    this.db.close();
  }
}
