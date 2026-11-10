import { NextResponse } from "next/server";
import { Chess } from "chess.js";
import { listRecentGames, saveGame } from "../store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ games: await listRecentGames() });
  } catch {
    return NextResponse.json({ error: "Game storage is unavailable. Configure DATABASE_URL for this deployment." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { id?: string; pgn?: string; fen?: string } | null;
  if (!body || typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.id)
    || typeof body.pgn !== "string" || body.pgn.length > 20000
    || typeof body.fen !== "string" || body.fen.length > 120) {
    return NextResponse.json({ error: "A valid game id, PGN, and board position are required." }, { status: 400 });
  }

  let game: Chess;
  try {
    game = new Chess();
    if (body.pgn) game.loadPgn(body.pgn);
    if (game.fen() !== body.fen) return NextResponse.json({ error: "The move history and board position do not match." }, { status: 422 });
  } catch {
    return NextResponse.json({ error: "The game history could not be saved." }, { status: 422 });
  }

  const moves = game.history().length;
  const title = moves >= 6 ? "A line worth remembering" : "Position exploration";
  const updatedAt = new Date().toISOString();
  try {
    await saveGame({ id: body.id, title, pgn: body.pgn, fen: body.fen, move_count: moves, updated_at: updatedAt });
    return NextResponse.json({ id: body.id, title, moveCount: moves, updatedAt });
  } catch {
    return NextResponse.json({ error: "Game storage is unavailable. Configure DATABASE_URL for this deployment." }, { status: 503 });
  }
}
