import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arab Automators — The short road to professional automation work",
  description:
    "Six weeks, live, in Arabic. Build real client-grade automation workflows, break them on purpose, and ship work you can charge for.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${plexArabic.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body text-text-body">{children}</body>
    </html>
  );
}
