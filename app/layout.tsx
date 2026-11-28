import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import {
  AUTHOR,
  GA_MEASUREMENT_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
  THEME_COLOR,
  TITLE_TEMPLATE,
} from "@/lib/site";
import { ConsentBanner } from "./_components/consent-banner";
import { GoogleAnalytics } from "./_components/google-analytics";
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

// Defaults for every page. Each page adds its canonical URL and Open Graph tags with pageMetadata().
export const metadata: Metadata = {
  // Relative URLs in metadata (canonical, Open Graph) resolve against this.
  metadataBase: new URL(SITE_URL),
  // The home page uses the default; other pages set a title and get "· OM Recipe Viewer" after it.
  title: { default: SITE_NAME, template: TITLE_TEMPLATE },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [AUTHOR],
  creator: AUTHOR.name,
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    // The name under the icon when the site is added to an iPhone's home screen.
    title: SITE_SHORT_NAME,
    // Opened from there, the page runs up under the status bar, which turns its text white to sit on
    // the black header. SiteHeader keeps that strip black once the header scrolls away.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  // The site is light only, so browsers draw form controls and scrollbars light too.
  colorScheme: "light",
  // Browsers that tint their toolbar to match the page blend it into the black header.
  themeColor: THEME_COLOR,
  // On phones, the page runs to the screen's edges, under the status bar, the notch and the home
  // indicator, so the black header and footer fill those strips instead of the phone filling them
  // white. Wherever something covers the page, the header, footer, page column and cookie banner
  // pad themselves clear of it with env(safe-area-inset-*), which is 0 everywhere else.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* First, so keyboard and screen reader users reach it before the page. It shows at the bottom.
            Dev builds show it too, to work on it, but only production builds load Google Analytics. */}
        {GA_MEASUREMENT_ID && <ConsentBanner />}
        <SiteHeader />
        {children}
        <SiteFooter />
        {/* Production builds only, so the dev server never sends anything to Google. */}
        {GA_MEASUREMENT_ID && process.env.NODE_ENV === "production" && (
          <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
