import { NextResponse } from "next/server";
import { Chess } from "chess.js";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { fen?: string; san?: string; ply?: number } | null;
  if (!body?.fen || !body.san) return NextResponse.json({ error: "Position and move are required." }, { status: 400 });
  try {
    const game = new Chess(body.fen);
    const move = game.move(body.san);
    if (!move) return NextResponse.json({ error: "That move is not legal in this position." }, { status: 422 });
    const message = move.captured
      ? `You took the ${move.captured} on ${move.to}. Check what that capture opens up before choosing your next plan.`
      : move.san.includes("+")
        ? "You gave check. Look for the follow-up: can you win material or improve a piece while the king responds?"
        : move.piece === "p" && ["d4", "e4", "d5", "e5"].includes(move.to)
          ? "This central pawn move claims space and opens lines for your pieces. Notice how the center shapes your next choices."
          : "Your move changes the position. Before continuing, ask what it supports and which opposing reply you need to account for.";
    return NextResponse.json({ message, san: move.san, fen: game.fen(), turn: game.turn(), check: game.isCheck() });
  } catch {
    return NextResponse.json({ error: "The board position could not be read." }, { status: 400 });
  }
}
