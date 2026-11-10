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
    learner: { name: "Alex", rating: 1240, streak: 6, weeklyMinutes: 84 },
    focus: { title: "Spot the loose piece", detail: "You missed undefended pieces in 3 of your last 8 games.", progress: 62 },
    recent: savedGames.length ? savedGames.map((game) => ({
      date: new Date(game.updated_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      title: game.title,
      result: "IN PROGRESS",
      accuracy: Math.min(96, 70 + game.move_count),
      theme: `${game.move_count} moves explored`,
    })) : [
      { date: "Today", title: "A calmer Sicilian", result: "WIN", accuracy: 86, theme: "Space & development" },
      { date: "Yesterday", title: "The rook endgame", result: "DRAW", accuracy: 79, theme: "King activity" },
      { date: "Nov 08", title: "Pressure on the e-file", result: "LOSS", accuracy: 72, theme: "Loose pieces" },
    ],
    skills: [
      { name: "Piece safety", score: 68, delta: "+8" },
      { name: "Opening plans", score: 74, delta: "+3" },
      { name: "King safety", score: 57, delta: "+6" },
      { name: "Endgames", score: 43, delta: "+2" },
    ],
  });
}
