import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "./_components/site-chrome";
import "./globals.css";

// Archivo with its width axis: regular width for text, expanded (font-stretch-expanded) for headings.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OM Recipe Viewer",
  description:
    "See the Color Profile, Monochrome Profile and picture settings stored in an OM System JPEG. Runs entirely in your browser.",
};

// The site is light only, so browsers draw form controls and scrollbars light too.
export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
