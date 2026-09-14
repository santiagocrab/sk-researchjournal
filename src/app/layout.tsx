import { RefreshLoader } from "@/components/layout/RefreshLoader";
import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";
import { BRAND_NAME } from "@/lib/branding";
import { AuthSessionProvider } from "@/components/auth/AuthSessionProvider";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const appName =
  env.APP_NAME === "Journal Platform" || !env.APP_NAME.trim() ? BRAND_NAME : env.APP_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: BRAND_NAME,
  ...(env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${sourceSerif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(performance.getEntriesByType('navigation')[0]?.type==='reload'){document.documentElement.setAttribute('data-refresh-loading','');setTimeout(function(){document.documentElement.removeAttribute('data-refresh-loading')},2500)}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <RefreshLoader />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
