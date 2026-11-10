import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres, { type Sql } from "postgres";

const globalForChess = globalThis as typeof globalThis & {
  chessDb?: DatabaseSync;
  postgres?: Sql;
  gamesSchemaReady?: Promise<void>;
};

const connectionString = process.env.DATABASE_URL;
const onVercel = process.env.VERCEL === "1";

function getLocalDatabase() {
  if (onVercel) {
    throw new Error("DATABASE_URL is required on Vercel. Connect a Postgres database to persist games.");
  }

  if (globalForChess.chessDb) return globalForChess.chessDb;

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

  globalForChess.chessDb = db;
  return db;
}

function getPostgres() {
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  globalForChess.postgres ??= postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return globalForChess.postgres;
}

async function ensurePostgresSchema(sql: Sql) {
  if (!globalForChess.gamesSchemaReady) {
    globalForChess.gamesSchemaReady = sql`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        pgn TEXT NOT NULL,
        fen TEXT NOT NULL,
        move_count INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    `.then(() => undefined);
  }

  try {
    await globalForChess.gamesSchemaReady;
  } catch (error) {
    globalForChess.gamesSchemaReady = undefined;
    throw error;
  }
}

export type SavedGame = {
  id: string;
  title: string;
  pgn: string;
  fen: string;
  move_count: number;
  updated_at: string;
};

export async function listRecentGames(): Promise<SavedGame[]> {
  if (connectionString) {
    const sql = getPostgres();
    await ensurePostgresSchema(sql);
    return await sql<SavedGame[]>`
      SELECT id, title, pgn, fen, move_count, updated_at
      FROM games ORDER BY updated_at DESC LIMIT 10
    `;
  }

  return getLocalDatabase()
    .prepare("SELECT id, title, pgn, fen, move_count, updated_at FROM games ORDER BY updated_at DESC LIMIT 10")
    .all() as unknown as SavedGame[];
}

export async function saveGame(game: SavedGame): Promise<void> {
  if (connectionString) {
    const sql = getPostgres();
    await ensurePostgresSchema(sql);
    await sql`
      INSERT INTO games (id, title, pgn, fen, move_count, updated_at)
      VALUES (${game.id}, ${game.title}, ${game.pgn}, ${game.fen}, ${game.move_count}, ${game.updated_at})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        pgn = EXCLUDED.pgn,
        fen = EXCLUDED.fen,
        move_count = EXCLUDED.move_count,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }

  getLocalDatabase()
    .prepare(`INSERT INTO games (id, title, pgn, fen, move_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title, pgn=excluded.pgn, fen=excluded.fen,
      move_count=excluded.move_count, updated_at=excluded.updated_at`)
    .run(game.id, game.title, game.pgn, game.fen, game.move_count, game.updated_at);
}
