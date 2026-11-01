import type { ReactNode } from "react";

export const metadata = { title: "TickerMint price widget" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 24 }}>{children}</body>
    </html>
  );
}
