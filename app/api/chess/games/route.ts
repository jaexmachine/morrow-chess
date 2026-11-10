import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { chessDb, listRecentGames } from "../store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ games: listRecentGames() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string; pgn?: string; fen?: string } | null;
  if (!body || typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.id)
    || typeof body.pgn !== "string" || body.pgn.length > 20000
    || typeof body.fen !== "string" || body.fen.length > 120) {
    return NextResponse.json({ error: "A valid game id, PGN, and board position are required." }, { status: 400 });
  }

  try {
    const game = new Chess();
    if (body.pgn) game.loadPgn(body.pgn);
    if (game.fen() !== body.fen) return NextResponse.json({ error: "The move history and board position do not match." }, { status: 422 });
    const moves = game.history().length;
    const title = moves >= 6 ? "A line worth remembering" : "Position exploration";
    const updatedAt = new Date().toISOString();
    chessDb.prepare(`INSERT INTO games (id, title, pgn, fen, move_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title=excluded.title, pgn=excluded.pgn, fen=excluded.fen,
      move_count=excluded.move_count, updated_at=excluded.updated_at`)
      .run(body.id, title, body.pgn, body.fen, moves, updatedAt);
    return NextResponse.json({ id: body.id, title, moveCount: moves, updatedAt });
  } catch {
    return NextResponse.json({ error: "The game history could not be saved." }, { status: 422 });
  }
}
