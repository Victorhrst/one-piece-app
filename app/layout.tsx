import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Grand Line — Wiki One Piece sans spoilers",
  description: "Explore l’univers de One Piece à ton rythme, avec un wiki filtré par l’arc que tu as terminé.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=5", sizes: "any" },
      { url: "/favicon-32.png?v=5", sizes: "32x32", type: "image/png" },
      { url: "/favicon.svg?v=5", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=5", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#0b1120" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/blades.css" />
      </head>
      <body>
        {children}
        <Script src="/data.js" strategy="beforeInteractive" />
        <Script src="/modules/catalog-repository.js" strategy="beforeInteractive" />
        <Script src="/modules/favorites.js" strategy="beforeInteractive" />
        <Script src="/modules/home.js" strategy="beforeInteractive" />
        <Script src="/modules/guide.js" strategy="beforeInteractive" />
        <Script src="/modules/crews.js" strategy="beforeInteractive" />
        <Script src="/modules/ships.js" strategy="beforeInteractive" />
        <Script src="/modules/government.js" strategy="beforeInteractive" />
        <Script src="/modules/blades.js" strategy="beforeInteractive" />
        <Script src="/modules/poneglyphs.js" strategy="beforeInteractive" />
        <Script src="/modules/characters.js" strategy="beforeInteractive" />
        <Script src="/modules/fruits.js" strategy="beforeInteractive" />
        <Script src="/modules/sources.js" strategy="beforeInteractive" />
        <Script src="/modules/map.js" strategy="beforeInteractive" />
        <Script src="/app.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
