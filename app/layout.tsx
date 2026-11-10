import type { Metadata } from "next";
import "./styles.css";
import "./chess.css";
import "./landing.css";
import "./workspace-theme.css";

export const metadata: Metadata = {
  title: "Morrow — Personal Chess Mentor",
  description: "Understand the intent behind your moves and turn recurring mistakes into progress.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
