import type { Metadata, Viewport } from "next";
import { NarratorProvider } from "@/lib/narrator";
import { BottomNav } from "@/components/BottomNav";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${APP_NAME}: ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: "Swipe short, narrated React lessons and quiz reels. 10 minutes a day.",
};

export const viewport: Viewport = {
  themeColor: "#20232a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NarratorProvider>
          <main className="app">{children}</main>
          <BottomNav />
        </NarratorProvider>
      </body>
    </html>
  );
}
