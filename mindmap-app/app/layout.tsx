import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindMap - A MindMeister-inspired mind mapping app",
  description: "Collaborative mind mapping made simple",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
