import { NextResponse } from "next/server";
import { listRecentGames } from "../store";

export const runtime = "nodejs";

export async function GET() {
  let savedGames;
  try {
    savedGames = await listRecentGames();
  } catch {
    return NextResponse.json({ error: "Game storage is unavailable. Configure DATABASE_URL for this deployment." }, { status: 503 });
  }

  return NextResponse.json({
    learner: { name: "Guest", streak: 0, weeklyMinutes: 0 },
    recent: savedGames.length ? savedGames.map((game) => ({
      date: new Date(game.updated_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      title: game.title,
      move_count: game.move_count,
    })) : [],
  });
}
