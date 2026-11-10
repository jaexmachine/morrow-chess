import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalForChess = globalThis as typeof globalThis & { chessDb?: DatabaseSync };

function createDatabase() {
  const dataDir = join(process.cwd(), ".data");
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, "chess.sqlite"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      pgn TEXT NOT NULL,
      fen TEXT NOT NULL,
      move_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export const chessDb = globalForChess.chessDb ?? createDatabase();
if (process.env.NODE_ENV !== "production") globalForChess.chessDb = chessDb;

export type SavedGame = { id: string; title: string; pgn: string; fen: string; move_count: number; updated_at: string };

export function listRecentGames(): SavedGame[] {
  return chessDb.prepare("SELECT id, title, pgn, fen, move_count, updated_at FROM games ORDER BY updated_at DESC LIMIT 10").all() as unknown as SavedGame[];
}
