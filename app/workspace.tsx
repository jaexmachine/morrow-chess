"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Page = "dashboard" | "play" | "review" | "progress";
type Summary = {
  learner: { name: string; rating: number; streak: number; weeklyMinutes: number };
  focus: { title: string; detail: string; progress: number };
  recent: Array<{ date: string; title: string; result: string; accuracy: number; theme: string }>;
  skills: Array<{ name: string; score: number; delta: string }>;
};

type BrowserSavedGame = {
  id: string;
  title: string;
  pgn: string;
  fen: string;
  move_count: number;
  updated_at: string;
};

const browserGamesKey = "morrow-chess.games.v1";
const browserGamesUpdatedEvent = "morrow-chess:games-updated";
const fallbackSummary: Summary = {
  learner: { name: "Alex", rating: 1240, streak: 6, weeklyMinutes: 84 },
  focus: { title: "Spot the loose piece", detail: "You missed undefended pieces in 3 of your last 8 games.", progress: 62 },
  recent: [
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
};

const symbols: Record<string, string> = { wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙", bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟" };
const navigation: Array<{ id: Page; label: string; icon: string; href: string }> = [
  { id: "dashboard", label: "Today", icon: "⌂", href: "/app" },
  { id: "play", label: "Learn & play", icon: "♞", href: "/play" },
  { id: "review", label: "Game review", icon: "↗", href: "/review" },
  { id: "progress", label: "Your progress", icon: "◷", href: "/progress" },
];

function readBrowserGames(): BrowserSavedGame[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(browserGamesKey) ?? "[]");
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is BrowserSavedGame =>
      item !== null && typeof item === "object"
      && typeof item.id === "string"
      && typeof item.title === "string"
      && typeof item.pgn === "string"
      && typeof item.fen === "string"
      && typeof item.move_count === "number"
      && typeof item.updated_at === "string",
    ).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 30);
  } catch {
    return [];
  }
}

function withBrowserGames(summary: Summary): Summary {
  const games = readBrowserGames();
  if (!games.length) return summary;

  return {
    ...summary,
    recent: games.slice(0, 10).map((game) => ({
      date: new Date(game.updated_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      title: game.title,
      result: "IN PROGRESS",
      accuracy: Math.min(96, 70 + game.move_count),
      theme: `${game.move_count} moves explored`,
    })),
  };
}

function isSummary(value: unknown): value is Summary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Summary>;
  return Boolean(candidate.learner && typeof candidate.learner.streak === "number"
    && candidate.focus && typeof candidate.focus.title === "string"
    && Array.isArray(candidate.recent) && Array.isArray(candidate.skills));
}

function saveBrowserGame(id: string, game: Chess) {
  const moves = game.history().length;
  const savedGame: BrowserSavedGame = {
    id,
    title: moves >= 6 ? "A line worth remembering" : "Position exploration",
    pgn: game.pgn(),
    fen: game.fen(),
    move_count: moves,
    updated_at: new Date().toISOString(),
  };

  try {
    const games = readBrowserGames().filter((item) => item.id !== id);
    window.localStorage.setItem(browserGamesKey, JSON.stringify([savedGame, ...games].slice(0, 30)));
    window.dispatchEvent(new Event(browserGamesUpdatedEvent));
    return true;
  } catch {
    return false;
  }
}

function identifyOpening(moves: string[]) {
  const line = moves.join(" ");
  if (line.startsWith("e4 c5")) return "Sicilian Defense";
  if (line.startsWith("e4 e5 Nf3 Nc6 Bb5")) return "Ruy Lopez";
  if (line.startsWith("d4 Nf6 c4 g6")) return "King’s Indian Defense";
  if (line.startsWith("d4 d5 c4")) return "Queen’s Gambit";
  if (moves.length >= 4) return "A flexible developing setup";
  return "A pattern is beginning to emerge";
}

export default function ChessWorkspace({ page }: { page: Page }) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary | null>(fallbackSummary);
  const queenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const refreshLocalGames = () => setSummary((current) => withBrowserGames(current ?? fallbackSummary));
    window.addEventListener(browserGamesUpdatedEvent, refreshLocalGames);

    fetch("/api/chess/summary")
      .then(async (response) => {
        if (!response.ok) throw new Error("Summary service is unavailable.");
        const data: unknown = await response.json();
        if (!isSummary(data)) throw new Error("Summary response is invalid.");
        if (active) setSummary(withBrowserGames(data));
      })
      .catch(() => {
        if (active) setSummary((current) => withBrowserGames(current ?? fallbackSummary));
      });

    return () => {
      active = false;
      window.removeEventListener(browserGamesUpdatedEvent, refreshLocalGames);
    };
  }, []);

  useEffect(() => {
    if (page !== "dashboard" || !queenRef.current) return;
    const queen = queenRef.current;
    const ctx = gsap.context(() => {
      gsap.to(queen, { y: -62, rotateY: 26, rotateZ: -8, scale: 1.05, ease: "none", scrollTrigger: { trigger: queen.closest(".kinetic-feature"), start: "top bottom", end: "bottom top", scrub: 0.8 } });
    }, queen);
    return () => ctx.revert();
  }, [page]);

  return <div className="chess-app">
    <aside className="chess-sidebar">
      <Link href="/app" className="chess-brand"><span className="brand-glyph">M</span><span><strong>morrow</strong><small>YOUR CHESS MENTOR</small></span></Link>
      <div className="side-caption">YOUR SPACE</div>
      <nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.id} href={item.href} className={(pathname === item.href ? "active " : "") + "side-link"}><span className="side-icon">{item.icon}</span>{item.label}{item.id === "play" && <i className="live-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="mentor-mini"><div className="mentor-orbit"><span>♔</span></div><div><small>MENTOR NOTE</small><p>Small plans build<br />strong habits.</p></div></div><div className="profile-row"><span className="avatar">A</span><span><b>Alex Morgan</b><small>Curious learner</small></span><span className="more">···</span></div></div>
    </aside>
    <main className="chess-main">
      <header className="chess-topbar"><div className="breadcrumb">YOUR SPACE <span>/</span> {navigation.find((item) => item.id === page)?.label.toUpperCase()}</div><div className="top-actions"><span className="streak-pill">✳ <b>{summary?.learner?.streak ?? 6}</b> day streak</span><button className="icon-button" aria-label="Notifications">♧<i /></button></div></header>
      {page === "dashboard" && <Dashboard summary={summary} queenRef={queenRef} />}
      {page === "play" && <Play />}
      {page === "review" && <Review summary={summary} />}
      {page === "progress" && <Progress summary={summary} />}
    </main>
  </div>;
}

function Dashboard({ summary, queenRef }: { summary: Summary | null; queenRef: React.RefObject<HTMLDivElement | null> }) {
  return <div className="page-content dashboard-page">
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> TUESDAY, NOVEMBER 10, 2026</div><h1>Good morning, {summary?.learner.name ?? "Alex"}<span className="title-period">.</span></h1><p className="welcome-copy">A little clarity can change your whole game.</p></div><Link className="button button-ink" href="/play">Continue learning <span>↗</span></Link></section>
    <section className="dashboard-grid">
      <article className="daily-card"><div className="card-head"><span className="eyebrow">TODAY’S FOCUS</span><span className="focus-number">01 / 03</span></div><div className="focus-body"><div className="focus-icon">⌖</div><div><h2>{summary?.focus.title ?? "Spot the loose piece"}</h2><p>{summary?.focus.detail ?? "You missed undefended pieces in 3 of your last 8 games."}</p></div></div><div className="focus-progress"><div><span>YOUR PATTERN</span><b>{summary?.focus.progress ?? 62}%</b></div><span className="progress-track"><i style={{ width: `${summary?.focus.progress ?? 62}%` }} /></span></div><Link className="text-link" href="/play">Work on this together <span>→</span></Link></article>
      <article className="week-card"><div className="card-head"><span className="eyebrow">YOUR WEEK, IN MOTION</span><span className="week-mark">↗ +12%</span></div><strong className="week-time">{summary?.learner.weeklyMinutes ?? 84}<small> min</small></strong><p>of thoughtful practice</p><div className="week-bars" aria-label="Practice minutes by day">{[34, 55, 42, 76, 58, 92, 48].map((h, i) => <div className="bar-column" key={i}><i style={{ height: `${h}%` }} className={i === 5 ? "bar-today" : ""} /><span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span></div>)}</div></article>
    </section>
    <section className="kinetic-feature"><div className="feature-copy"><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT MOVE</div><h2>Play with a<br /><em>little more</em><br />intention.</h2><p>Not more games. Better questions. Explore a position with your mentor and see what each move makes possible.</p><Link href="/play" className="button button-light">Explore a position <span>↗</span></Link></div><div className="feature-stage"><div className="stage-grid" /><div className="stage-ring ring-one" /><div className="stage-ring ring-two" /><div className="queen-3d" ref={queenRef} aria-label="Sculptural 3D chess queen"><span>♕</span></div><div className="stage-label stage-label-top">CONSIDER THE CENTER <i /></div><div className="stage-label stage-label-bottom"><i /> FIND YOUR NEXT IDEA</div><div className="stage-coordinate">e4 <span>↗</span></div></div><span className="feature-index">01 — 04</span></section>
    <section className="recent-section"><div className="section-heading"><div><div className="eyebrow">REFLECTIONS</div><h2>Recent games</h2></div><Link href="/review" className="text-link">See all reviews <span>→</span></Link></div><div className="game-list">{(summary?.recent ?? []).map((game, i) => <Link href="/review" className="game-row" key={game.title}><span className="game-index">0{i + 1}</span><span className="game-date">{game.date}</span><span className="game-title">{game.title}<small>{game.theme}</small></span><span className={`result result-${game.result.toLowerCase()}`}>{game.result}</span><span className="accuracy">{game.accuracy}<small>%</small></span><span className="row-arrow">↗</span></Link>)}</div></section>
    <footer className="app-footer"><span>PLAY THOUGHTFULLY. GROW STEADILY.</span><span>MADE FOR THE LONG GAME <i>♞</i></span></footer>
  </div>;
}

function Play() {
  const gameRef = useRef(new Chess());
  const gameIdRef = useRef("");
  const [fen, setFen] = useState(gameRef.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [notice, setNotice] = useState("Your mentor is here to help you notice the idea behind each move.");
  const [busy, setBusy] = useState(false);
  const [branch, setBranch] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const game = gameRef.current;
  const board = useMemo(() => { const g = new Chess(fen); return g.board(); }, [fen]);
  const files = "abcdefgh";
  const squares = board.flatMap((row, rank) => row.map((piece, file) => ({ piece, square: `${files[file]}${8 - rank}` as Square, rank, file })));
  const displayedSquares = flipped ? [...squares].reverse() : squares;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function choose(square: Square) {
    if (busy) return;
    const piece = game.get(square);
    if (!selected) { if (piece?.color === game.turn()) setSelected(square); return; }
    if (piece?.color === game.turn()) { setSelected(square); return; }
    const before = game.fen();
    let move;
    try { move = game.move({ from: selected, to: square, promotion: "q" }); } catch { move = null; }
    if (!move) { setSelected(null); return; }
    const san = move.san;
    setFen(game.fen()); setSelected(null); setBusy(true);
    if (!gameIdRef.current) gameIdRef.current = crypto.randomUUID();
    const gameId = gameIdRef.current;
    const locallySaved = saveBrowserGame(gameId, game);
    if (!locallySaved) setNotice("This browser could not save the game. Your move is still on the board.");
    try {
      const response = await fetch("/api/chess/mentor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fen: before, san, ply: game.history().length }) });
      const result = await response.json(); setNotice(result.message ?? "Your move is on the board.");
    } catch { setNotice("Move recorded. Your mentor is having trouble connecting."); }
    try {
      await fetch("/api/chess/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: gameId, pgn: game.pgn(), fen: game.fen() }) });
    } catch { /* Keep the board usable if local save is unavailable. */ }
    finally { setBusy(false); }
  }

  async function undo() { if (!game.undo()) return; setFen(game.fen()); setSelected(null); setBranch((n) => n + 1); setNotice("We stepped back. Try another idea and compare how the position changes."); if (gameIdRef.current) { saveBrowserGame(gameIdRef.current, game); await fetch("/api/chess/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: gameIdRef.current, pgn: game.pgn(), fen: game.fen() }) }).catch(() => {}); } }
  function reset() { game.reset(); setFen(game.fen()); gameIdRef.current = ""; setSelected(null); setBranch(0); setNotice("A fresh board. What would you like to explore?"); }

  return <div className="page-content play-page"><div className="play-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> LEARN BY EXPLORING</div><h1>Make a move.<br /><em>Find its meaning.</em></h1></div><span className="session-label"><i /> PRACTICE SESSION</span></div><div className="play-layout"><section className="board-panel"><div className="board-topline"><span>POSITION EXPLORER</span><span>{game.turn() === "w" ? "WHITE" : "BLACK"} TO MOVE</span></div><div className="board-wrap"><div className="chessboard" role="grid" aria-label="Interactive chess board">{displayedSquares.map(({ piece, square, rank, file }) => { const light = (rank + file) % 2 === 0; const isSelected = selected === square; const edgeFile = flipped ? file === 7 : file === 0; const edgeRank = flipped ? rank === 0 : rank === 7; return <button key={square} type="button" role="gridcell" aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : " empty"}`} className={`board-square ${light ? "light" : "dark"} ${isSelected ? "selected" : ""}`} onClick={() => choose(square)} onDragOver={(e) => e.preventDefault()} onDrop={() => choose(square)}>{piece && <span draggable onDragStart={() => setSelected(square)} className={`piece ${piece.color === "w" ? "piece-white" : "piece-black"}`}>{symbols[`${piece.color}${piece.type}`]}</span>}{edgeFile && <small className={light ? "coord-dark" : "coord-light"}>{flipped ? rank + 1 : 8 - rank}</small>}{edgeRank && <small className={`file-coord ${light ? "coord-dark" : "coord-light"}`}>{files[flipped ? 7 - file : file]}</small>}</button>; })}</div></div><div className="board-controls"><button onClick={undo} className="control-button">← <span>Undo</span></button><button onClick={reset} className="control-button">↻ <span>Reset</span></button><div className="branch-count">{branch ? `${branch} alternate ${branch === 1 ? "line" : "lines"} explored` : "Learn mode · explore freely"}</div><button className="control-button" onClick={() => setFlipped((value) => !value)}>⇅ <span>Flip</span></button></div></section><aside className="mentor-panel"><div className="mentor-panel-head"><span className="mentor-avatar">♔</span><div><small>YOUR PERSONAL MENTOR</small><b>Let’s think it through</b></div><span className="online-dot" /></div><div className="mentor-message"><div className="message-tag">POSITION NOTE <span>✳</span></div><p>{notice}</p><div className="mentor-question">What does your move improve — and what does it leave behind?</div></div><div className="position-detail"><div className="detail-label">MOVE HISTORY</div><div className="move-history">{game.history().length ? game.history().map((move, i) => <span key={`${i}-${move}`}><small>{Math.floor(i / 2) + 1}{i % 2 ? "..." : "."}</small>{move}</span>) : <span className="empty-moves">The first move is yours.</span>}</div><div className="detail-label opening-label">OPENING PATTERN <span>DETECTING</span></div><div className="opening-note">{game.history().length >= 2 ? identifyOpening(game.history()) : "Waiting for a few moves"}</div></div><div className="mentor-panel-foot"><span>RULE-BASED GUIDANCE</span><span>UNDO WITH <kbd>CTRL</kbd> + <kbd>Z</kbd></span></div></aside></div><p className="play-footnote">Explore freely. Undo a move to try another line and see what changes.</p></div>;
}

function Review({ summary }: { summary: Summary | null }) {
  const [selected, setSelected] = useState(0);
  const game = summary?.recent[selected];
  return <div className="page-content subpage"><div className="eyebrow"><span className="eyebrow-line" /> A CLEARER LOOK BACK</div><div className="subpage-title-row"><div><h1>Every game leaves<br /><em>a useful clue.</em></h1><p>Review the decisions that shaped the position — and carry one idea into your next game.</p></div><select aria-label="Choose a game to review" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>{(summary?.recent ?? []).map((g, i) => <option key={g.title} value={i}>{g.title}</option>)}</select></div><div className="review-grid"><article className="review-score"><span className="eyebrow">GAME ACCURACY</span><strong>{game?.accuracy ?? 86}<small>%</small></strong><p>{game?.title ?? "A calmer Sicilian"}</p><div className="review-line"><i style={{ width: `${game?.accuracy ?? 86}%` }} /></div><div className="score-legend"><span><i className="dot-good" /> Thoughtful moves <b>24</b></span><span><i className="dot-miss" /> Missed chances <b>3</b></span><span><i className="dot-blunder" /> Costly moments <b>1</b></span></div></article><article className="review-mentor"><div className="mentor-panel-head"><span className="mentor-avatar">♔</span><div><small>THE BIG IDEA</small><b>A pattern to remember</b></div></div><h2>Development gave you<br />the easier game.</h2><p>You brought both knights into play before starting a kingside attack. That gave your pieces more choices and kept your king safe.</p><div className="review-callout"><span>ONE THING TO TRY</span><p>Before a pawn break, ask: “Are my pieces ready to use the open lines?”</p></div><Link href="/play" className="text-link">Explore this position <span>→</span></Link></article></div><div className="review-section"><div className="section-heading"><div><div className="eyebrow">KEY MOMENTS</div><h2>Decisions that mattered</h2></div><span className="small-muted">MOVE-BY-MOVE REFLECTION</span></div><div className="moment-row"><span className="moment-move">12. Nf3</span><span className="moment-pill moment-good">GOOD IDEA</span><div><b>Connected your pieces</b><p>Your knight supports the center and keeps the e-file flexible.</p></div><span className="moment-eval">+0.6</span><span className="row-arrow">↗</span></div><div className="moment-row"><span className="moment-move">21. h4</span><span className="moment-pill moment-missed">MISSED CHANCE</span><div><b>There was time to improve first</b><p>Repositioning your rook would have made the pawn push more effective.</p></div><span className="moment-eval">+0.1</span><span className="row-arrow">↗</span></div></div></div>;
}

function Progress({ summary }: { summary: Summary | null }) {
  return <div className="page-content subpage progress-page"><div className="eyebrow"><span className="eyebrow-line" /> THE SHAPE OF YOUR GAME</div><div className="subpage-title-row"><div><h1>Progress you<br /><em>can feel.</em></h1><p>Skill grows in small, repeatable moments. Here’s what’s getting stronger.</p></div><span className="rating-badge"><small>ESTIMATED STRENGTH</small><b>{summary?.learner.rating ?? 1240}</b><span>↗ +42 this month</span></span></div><div className="progress-hero"><div className="progress-hero-copy"><span className="eyebrow">YOUR PERSONAL PATTERN</span><h2>Safer pieces.<br /><em>Clearer plans.</em></h2><p>You’re noticing loose pieces earlier. That gives you more time to choose a plan, instead of reacting to a threat.</p><div className="month-change">+8 <small>points this month</small></div></div><div className="progress-chart"><div className="chart-y"><span>80</span><span>60</span><span>40</span><span>20</span></div><div className="chart-area"><div className="chart-gridlines"><i/><i/><i/><i/></div><svg viewBox="0 0 560 220" preserveAspectRatio="none" aria-label="Piece safety improved from 44 to 68 this month"><defs><linearGradient id="progressFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#92bdb0" stopOpacity=".28"/><stop offset="100%" stopColor="#92bdb0" stopOpacity="0"/></linearGradient></defs><path className="chart-fill" d="M0 168 C45 164 54 145 95 150 S145 133 185 140 S233 112 278 123 S324 102 370 110 S420 79 462 91 S520 56 560 58 L560 220 L0 220Z"/><path className="chart-stroke" d="M0 168 C45 164 54 145 95 150 S145 133 185 140 S233 112 278 123 S324 102 370 110 S420 79 462 91 S520 56 560 58"/><circle cx="560" cy="58" r="5" className="chart-dot"/></svg><div className="chart-x"><span>OCT 13</span><span>OCT 20</span><span>OCT 27</span><span>NOV 03</span><span>NOV 10</span></div></div></div></div><div className="skills-section"><div className="section-heading"><div><div className="eyebrow">SKILL MAP</div><h2>Four parts of a stronger game</h2></div><span className="small-muted">LAST 30 DAYS</span></div><div className="skill-list">{(summary?.skills ?? []).map((skill, i) => <div className="skill-row" key={skill.name}><span className="skill-num">0{i + 1}</span><b>{skill.name}</b><div className="skill-meter"><i style={{ width: `${skill.score}%` }} /></div><span className="skill-score">{skill.score}</span><span className="skill-delta">{skill.delta}</span></div>)}</div></div></div>;
}

