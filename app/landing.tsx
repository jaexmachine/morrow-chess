"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BrandMark from "./brand-mark";

const pawn = `       .---.\n      /     \\\n     |       |\n     |       |\n      \\     /\n       |   |\n       |   |\n      /     \\\n     /       \\\n    /_________\\`;

export default function ChessLanding() {
  const sceneRef = useRef<HTMLElement>(null);
  const pawnRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sceneRef.current,
          start: "top top",
          end: "+=1150",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(pawnRef.current, { rotateY: 390, rotateX: -12, y: -70, scale: 0.62, ease: "none" }, 0)
        .to(noteRef.current, { opacity: 0, y: -26, ease: "none" }, 0)
        .to(messageRef.current, { opacity: 1, y: 0, ease: "none" }, 0.34);
    }, sceneRef);

    return () => context.revert();
  }, []);

  return (
    <main className="morrow-landing">
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="Morrow Chess Mentor home">
          <BrandMark className="landing-mark" /><span>MORROW<span className="brand-small">CHESS MENTOR</span></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#method">THE METHOD</a>
          <a href="#practice">PRACTICE</a>
          <Link className="header-app-link" href="/app">OPEN THE APP <span>↗</span></Link>
        </nav>
      </header>

      <section className="pawn-scene" ref={sceneRef} aria-label="Meet your chess mentor">
        <div className="scene-topline"><span>PERSONAL CHESS MENTOR</span><span>01 / 03</span></div>
        <div className="dot-field" aria-hidden="true" />
        <div className="pawn-orbit" aria-hidden="true"><span /><span /><span /></div>
        <div className="ascii-pawn" ref={pawnRef} role="img" aria-label="A floating ASCII chess pawn">
          <pre className="pawn-depth pawn-depth-three">{pawn}</pre>
          <pre className="pawn-depth pawn-depth-two">{pawn}</pre>
          <pre className="pawn-depth pawn-depth-one">{pawn}</pre>
          <pre className="pawn-face">{pawn}</pre>
        </div>
        <div className="pawn-coordinate" aria-hidden="true">A SMALL PIECE.<br />A BIGGER PICTURE.</div>
        <div className="scene-note" ref={noteRef}><span className="scroll-line" />SCROLL TO SEE WHAT OPENS UP</div>
        <div className="landing-reveal" ref={messageRef}>
          <p className="eyebrow-mono">LEARN THE REASON BEHIND THE MOVE</p>
          <h1>PLAY WITH<br />MORE <span>INTENT.</span></h1>
          <p className="hero-description">A chess mentor that helps you see what your moves mean — and turn the patterns you miss into the progress you can feel.</p>
          <Link className="landing-cta" href="/app">STEP INTO YOUR WORKSPACE <span>↗</span></Link>
        </div>
        <div className="scene-bottomline"><span>FOCUS / REFLECT / IMPROVE</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="landing-intro" id="method">
        <div className="intro-copy"><h2>Not just the best move.<br /><span>Why it matters.</span></h2><p>Every position holds a choice. Morrow helps you understand the pressure, possibility, and purpose behind each one — so your next decision is yours to make.</p></div>
      </section>

      <section className="learning-sequence" id="practice">
        <div className="sequence-heading"><span className="eyebrow-mono">A PRACTICE THAT ADDS UP</span><h2>See it.<br />Understand it.<br /><span>Use it.</span></h2></div>
        <div className="sequence-steps">
          <article><span>01 / REVIEW</span><h3>Look back without judgment.</h3><p>Find the moments that changed your game, with a mentor who makes the position easier to read.</p><b>↘</b></article>
          <article><span>02 / EXPLORE</span><h3>Try another way through.</h3><p>Compare candidate moves, follow the consequences, and learn what the board was asking of you.</p><b>↘</b></article>
          <article><span>03 / RETURN</span><h3>Notice what’s getting stronger.</h3><p>See the patterns you’re improving and choose one clear idea to take into your next game.</p><b>↗</b></article>
        </div>
      </section>

      <section className="landing-board-section">
        <PracticeBoard />
      </section>

      <footer className="landing-footer">
        <div className="footer-top"><span className="eyebrow-mono">THE NEXT GOOD MOVE STARTS HERE</span><Link href="/app">OPEN MORROW <span>↗</span></Link></div>
        <div className="footer-bottom"><Link className="landing-brand" href="/"><BrandMark className="landing-mark" /><span>MORROW<span className="brand-small">CHESS MENTOR</span></span></Link><span>THINK CLEARER. PLAY YOUR GAME.</span><span>© MORROW 2026</span></div>
      </footer>
    </main>
  );
}

function PracticeBoard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const files = "abcdefgh";
  const pawnRadius = 8;

  function moveToPointer(clientX: number, clientY: number) {
    const bounds = boardRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = ((clientX - bounds.left - dragOffset.current.x) / bounds.width) * 100;
    const y = ((clientY - bounds.top - dragOffset.current.y) / bounds.height) * 100;
    setPosition({
      x: Math.min(100 - pawnRadius, Math.max(pawnRadius, x)),
      y: Math.min(100 - pawnRadius, Math.max(pawnRadius, y)),
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const directions: Record<string, { file: number; row: number }> = {
      ArrowLeft: { file: -1, row: 0 }, ArrowRight: { file: 1, row: 0 },
      ArrowUp: { file: 0, row: -1 }, ArrowDown: { file: 0, row: 1 },
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    setPosition((current) => ({
      x: Math.min(100 - pawnRadius, Math.max(pawnRadius, current.x + direction.file * 2.5)),
      y: Math.min(100 - pawnRadius, Math.max(pawnRadius, current.y + direction.row * 2.5)),
    }));
  }

  const square = `${files[Math.min(7, Math.floor(position.x / 12.5))]}${8 - Math.min(7, Math.floor(position.y / 12.5))}`;

  return <div className="board-graphic" ref={boardRef} aria-label="Interactive chessboard. Move the pawn freely inside the board by dragging it or using the arrow keys.">
    {Array.from({ length: 64 }, (_, index) => <span aria-hidden="true" className={(Math.floor(index / 8) + index % 8) % 2 ? "is-dark" : ""} key={index} />)}
    <button
      aria-label={`White pawn near ${square}. Drag it freely inside the board or use the arrow keys. It stays within the board edges.`}
      className={`board-pawn${dragging ? " is-dragging" : ""}`}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={() => setDragging(false)}
      onPointerDown={(event) => {
        event.preventDefault();
        const board = boardRef.current?.getBoundingClientRect();
        if (board) {
          dragOffset.current = {
            x: event.clientX - (board.left + (position.x / 100) * board.width),
            y: event.clientY - (board.top + (position.y / 100) * board.height),
          };
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => { if (dragging && event.buttons !== 0) moveToPointer(event.clientX, event.clientY); }}
      onPointerUp={(event) => { if (dragging) moveToPointer(event.clientX, event.clientY); setDragging(false); }}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      type="button"
    ><span aria-hidden="true">♙</span></button>
    <span className="sr-only" aria-live="polite">White pawn is on {square}.</span>
  </div>;
}

