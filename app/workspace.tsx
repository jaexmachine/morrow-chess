"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BrandMark from "./brand-mark";

gsap.registerPlugin(ScrollTrigger);

function handlePieceDragStart(event: DragEvent<HTMLSpanElement>, selectPiece: () => void) {
  selectPiece();

  const source = event.currentTarget;
  const sourceStyle = window.getComputedStyle(source);
  const dragImage = source.cloneNode(true) as HTMLSpanElement;
  Object.assign(dragImage.style, {
    position: "fixed",
    top: "0",
    left: "0",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0",
    padding: "0",
    border: "0",
    background: "transparent",
    boxShadow: "none",
    color: sourceStyle.color,
    fontFamily: sourceStyle.fontFamily,
    fontSize: sourceStyle.fontSize,
    lineHeight: sourceStyle.lineHeight,
    textShadow: sourceStyle.textShadow,
    pointerEvents: "none",
    zIndex: "-1",
  });

  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, dragImage.offsetWidth / 2, dragImage.offsetHeight / 2);
  window.setTimeout(() => dragImage.remove(), 0);
}

type Page = "dashboard" | "play" | "review" | "progress";
type Summary = {
  learner: { name: string; streak: number; weeklyMinutes: number };
  recent: Array<{ date: string; title: string; move_count: number }>;
};

type BrowserSavedGame = {
  id: string;
  title: string;
  pgn: string;
  fen: string;
  move_count: number;
  updated_at: string;
};

type CapturedPiece = {
  id: string;
  capturedBy: "w" | "b";
  color: "w" | "b";
  name: string;
  symbol: string;
};

type GameOutcome = {
  kind: "win" | "draw";
  headline: string;
  detail: string;
};

const browserGamesKey = "morrow-chess.games.v1";
const browserGamesUpdatedEvent = "morrow-chess:games-updated";
const fallbackSummary: Summary = {
  learner: { name: "Guest", streak: 0, weeklyMinutes: 0 },
  recent: [],
};

const symbols: Record<string, string> = { wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙", bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟" };
const pieceNames: Record<string, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen" };
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
      move_count: game.move_count,
    })),
  };
}

function isSummary(value: unknown): value is Summary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Summary>;
  return Boolean(candidate.learner && candidate.learner.name === "Guest"
    && typeof candidate.learner.streak === "number"
    && typeof candidate.learner.weeklyMinutes === "number"
    && Array.isArray(candidate.recent));
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

function getGameOutcome(game: Chess): GameOutcome | null {
  if (game.isCheckmate()) {
    return { kind: "win", headline: `${game.turn() === "w" ? "BLACK" : "WHITE"} WINS`, detail: "CHECKMATE" };
  }
  if (game.isStalemate()) return { kind: "draw", headline: "DRAW", detail: "STALEMATE" };
  if (!game.isDraw()) return null;

  const detail = game.isThreefoldRepetition()
    ? "REPETITION"
    : game.isInsufficientMaterial()
      ? "INSUFFICIENT MATERIAL"
      : game.isDrawByFiftyMoves()
        ? "50-MOVE RULE"
        : "DRAW";
  return { kind: "draw", headline: "DRAW", detail };
}

function GameStatus({ game, outcome }: { game: Chess; outcome: GameOutcome | null }) {
  if (outcome) {
    return (
      <span className={`game-outcome game-outcome-${outcome.kind}`} role="status" aria-live="polite">
        <strong>{outcome.headline}</strong>
        <small>{outcome.detail}</small>
      </span>
    );
  }

  return (
    <span className={`turn-indicator${game.isCheck() ? " is-check" : ""}`} role="status" aria-live="polite">
      <i aria-hidden="true" />
      {game.turn() === "w" ? "WHITE" : "BLACK"} TO MOVE{game.isCheck() ? " · IN CHECK" : ""}
    </span>
  );
}

function CapturedPieces({ pieces }: { pieces: CapturedPiece[] }) {
  const byWhite = pieces.filter((piece) => piece.capturedBy === "w");
  const byBlack = pieces.filter((piece) => piece.capturedBy === "b");

  return (
    <div className="captured-pieces" aria-label="Captured pieces">
      {([
        { color: "w", label: "TAKEN BY WHITE", pieces: byWhite },
        { color: "b", label: "TAKEN BY BLACK", pieces: byBlack },
      ] as const).map((group) => (
        <section className="captured-group" key={group.color} aria-label={group.label}>
          <div className="captured-heading">
            <span>{group.label}</span>
            <b>{group.pieces.length}</b>
          </div>
          <div className="captured-list">
            {group.pieces.length ? group.pieces.map((piece) => (
              <span
                key={piece.id}
                className={`captured-piece ${piece.color === "w" ? "piece-white" : "piece-black"}`}
                aria-label={`${piece.color === "w" ? "White" : "Black"} ${piece.name}`}
                title={`${piece.color === "w" ? "White" : "Black"} ${piece.name}`}
              >
                {piece.symbol}
              </span>
            )) : <span className="capture-empty">NONE YET</span>}
          </div>
        </section>
      ))}
    </div>
  );
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
      <Link href="/app" className="chess-brand"><BrandMark className="brand-glyph" /><span><strong>morrow</strong><small>YOUR CHESS MENTOR</small></span></Link>
      <div className="side-caption">YOUR SPACE</div>
      <nav aria-label="Main navigation">{navigation.map((item) => <Link key={item.id} href={item.href} className={(pathname === item.href ? "active " : "") + "side-link"}><span className="side-icon">{item.icon}</span>{item.label}{item.id === "play" && <i className="live-dot" />}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="profile-row"><span className="avatar">G</span><span><b>Guest</b><small>LOCAL PROFILE</small></span></div></div>
    </aside>
    <main className="chess-main">
      <header className="chess-topbar"><div className="breadcrumb">YOUR SPACE <span>/</span> {navigation.find((item) => item.id === page)?.label.toUpperCase()}</div><div className="top-actions"><span className="streak-pill">✳ <b>{summary?.learner?.streak ?? 0}</b> day streak</span></div></header>
      {page === "dashboard" && <Dashboard summary={summary} queenRef={queenRef} />}
      {page === "play" && <Play />}
      {page === "review" && <Review summary={summary} />}
      {page === "progress" && <Progress />}
    </main>
  </div>;
}

function Dashboard({ summary, queenRef }: { summary: Summary | null; queenRef: React.RefObject<HTMLDivElement | null> }) {
  return <div className="page-content dashboard-page">
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> GUEST SESSION</div><h1>Welcome, {summary?.learner.name ?? "Guest"}<span className="title-period">.</span></h1><p className="welcome-copy">Your chess workspace starts fresh.</p></div><Link className="button button-ink" href="/play">Start learning <span>↗</span></Link></section>
    <section className="dashboard-grid">
      <article className="daily-card"><div className="card-head"><span className="eyebrow">FIRST STEP</span><span className="focus-number">0%</span></div><div className="focus-body"><div className="focus-icon">⌖</div><div><h2>No progress yet</h2><p>Play a game to start building your learning history.</p></div></div><div className="focus-progress"><div><span>TRACKED</span><b>0%</b></div><span className="progress-track"><i style={{ width: "0%" }} /></span></div><Link className="text-link" href="/play">Open the board <span>→</span></Link></article>
      <article className="week-card"><div className="card-head"><span className="eyebrow">THIS WEEK</span><span className="week-mark">NO DATA</span></div><strong className="week-time">{summary?.learner.weeklyMinutes ?? 0}<small> min</small></strong><p>Practice time will appear after your first session.</p></article>
    </section>
    <section className="kinetic-feature"><div className="feature-copy"><div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT MOVE</div><h2>Play with a<br /><em>little more</em><br />intention.</h2><p>Not more games. Better questions. Explore a position with your mentor and see what each move makes possible.</p><Link href="/play" className="button button-light">Explore a position <span>↗</span></Link></div><div className="feature-stage"><div className="stage-grid" /><div className="stage-ring ring-one" /><div className="stage-ring ring-two" /><div className="queen-3d" ref={queenRef} aria-label="Sculptural 3D chess queen"><span>♕</span></div><div className="stage-label stage-label-top">CONSIDER THE CENTER <i /></div><div className="stage-label stage-label-bottom"><i /> FIND YOUR NEXT IDEA</div><div className="stage-coordinate">e4 <span>↗</span></div></div><span className="feature-index">01 — 04</span></section>
    <section className="recent-section"><div className="section-heading"><div><div className="eyebrow">YOUR HISTORY</div><h2>Saved games</h2></div><Link href="/review" className="text-link">Open review <span>→</span></Link></div>{summary?.recent.length ? <div className="game-list">{summary.recent.map((game, i) => <Link href="/review" className="game-row" key={`${game.title}-${game.date}`}><span className="game-index">0{i + 1}</span><span className="game-date">{game.date}</span><span className="game-title">{game.title}<small>{game.move_count} moves saved</small></span><span className="result result-saved">SAVED</span><span className="row-arrow">↗</span></Link>)}</div> : <p className="quiet-empty">No saved games yet. Your positions will appear here.</p>}</section>
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
  const outcome = getGameOutcome(game);
  const capturedPieces = game.history({ verbose: true }).flatMap((move, index) => {
    if (!move.captured) return [];
    const color: "w" | "b" = move.color === "w" ? "b" : "w";
    return [{
      id: `${index}-${move.from}-${move.to}`,
      capturedBy: move.color,
      color,
      name: pieceNames[move.captured],
      symbol: symbols[`${color}${move.captured}`],
    }];
  });

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

  return <div className="page-content play-page"><div className="play-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> LEARN BY EXPLORING</div><h1>Make a move.<br /><em>Find its meaning.</em></h1></div><span className="session-label"><i /> PRACTICE SESSION</span></div><div className="play-layout"><section className="board-panel"><div className="board-topline"><span>POSITION EXPLORER</span><GameStatus game={game} outcome={outcome} /></div><div className="board-wrap"><div className="chessboard" role="grid" aria-label="Interactive chess board">{displayedSquares.map(({ piece, square, rank, file }) => { const light = (rank + file) % 2 === 0; const isSelected = selected === square; const edgeFile = flipped ? file === 7 : file === 0; const edgeRank = flipped ? rank === 0 : rank === 7; return <button key={square} type="button" role="gridcell" aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : " empty"}`} className={`board-square ${light ? "light" : "dark"} ${isSelected ? "selected" : ""}`} onClick={() => choose(square)} onDragOver={(e) => e.preventDefault()} onDrop={() => choose(square)}>{piece && <span draggable onDragStart={(event) => handlePieceDragStart(event, () => setSelected(square))} className={`piece ${piece.color === "w" ? "piece-white" : "piece-black"}`}>{symbols[`${piece.color}${piece.type}`]}</span>}{edgeFile && <small className={light ? "coord-dark" : "coord-light"}>{flipped ? rank + 1 : 8 - rank}</small>}{edgeRank && <small className={`file-coord ${light ? "coord-dark" : "coord-light"}`}>{files[flipped ? 7 - file : file]}</small>}</button>; })}</div></div><CapturedPieces pieces={capturedPieces} /><div className="board-controls"><button onClick={undo} className="control-button">← <span>Undo</span></button><button onClick={reset} className="control-button">↻ <span>Reset</span></button><div className="branch-count">{branch ? `${branch} alternate ${branch === 1 ? "line" : "lines"} explored` : "Learn mode · explore freely"}</div><button className="control-button" onClick={() => setFlipped((value) => !value)}>⇅ <span>Flip</span></button></div></section><aside className="mentor-panel"><div className="mentor-panel-head"><span className="mentor-avatar">♔</span><div><small>YOUR PERSONAL MENTOR</small><b>Let’s think it through</b></div><span className="online-dot" /></div><div className="mentor-message"><div className="message-tag">POSITION NOTE <span>✳</span></div><p>{notice}</p><div className="mentor-question">What does your move improve — and what does it leave behind?</div></div><div className="position-detail"><div className="detail-label">MOVE HISTORY</div><div className="move-history">{game.history().length ? game.history().map((move, i) => <span key={`${i}-${move}`}><small>{Math.floor(i / 2) + 1}{i % 2 ? "..." : "."}</small>{move}</span>) : <span className="empty-moves">The first move is yours.</span>}</div><div className="detail-label opening-label">OPENING PATTERN <span>DETECTING</span></div><div className="opening-note">{game.history().length >= 2 ? identifyOpening(game.history()) : "Waiting for a few moves"}</div></div><div className="mentor-panel-foot"><span>RULE-BASED GUIDANCE</span><span>UNDO WITH <kbd>CTRL</kbd> + <kbd>Z</kbd></span></div></aside></div><p className="play-footnote">Explore freely. Undo a move to try another line and see what changes.</p></div>;
}

function Review({ summary }: { summary: Summary | null }) {
  const games = summary?.recent ?? [];

  return (
    <div className="page-content subpage">
      <div className="eyebrow"><span className="eyebrow-line" /> GAME REVIEW</div>
      <div className="subpage-title-row">
        <div>
          <h1>Review your<br /><em>saved games.</em></h1>
          <p>Only positions saved in this Guest profile appear here.</p>
        </div>
        <span className="small-muted">{games.length} SAVED</span>
      </div>
      {games.length ? (
        <div className="saved-game-list">
          {games.map((game) => (
            <article className="saved-game-row" key={`${game.title}-${game.date}`}>
              <span className="saved-game-date">{game.date}</span>
              <div><h2>{game.title}</h2><p>{game.move_count} moves saved</p></div>
              <span className="result result-saved">SAVED</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>NO SAVED GAMES</span>
          <h2>Nothing to review yet.</h2>
          <p>Play a game to start your history. Your progress remains empty until you build it.</p>
          <Link href="/play" className="button button-ink">Go to the board <span>↗</span></Link>
        </div>
      )}
    </div>
  );
}

function Progress() {
  return (
    <div className="page-content subpage progress-page">
      <div className="eyebrow"><span className="eyebrow-line" /> GUEST PROFILE</div>
      <div className="subpage-title-row">
        <div>
          <h1>Your progress.<br /><em>Starts at zero.</em></h1>
          <p>No rating, streak, or skill history has been recorded.</p>
        </div>
      </div>
      <section className="progress-empty" aria-label="No tracked progress">
        <span className="progress-empty-count">0</span>
        <div>
          <span className="progress-empty-label">GAMES ANALYZED</span>
          <p>Play and review games to start building your learning history.</p>
        </div>
        <Link href="/play" className="button button-ink">Start a game <span>↗</span></Link>
      </section>
    </div>
  );
}
